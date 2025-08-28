import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FiltersService } from './FiltersService';
import { DateRange } from './DataService';

// Helpers to mock localStorage per test
function createLocalStorageMock() {
  const store: Record<string, string> = {};
  const calls = {
    getItem: [] as [string][],
    setItem: [] as [string, string][],
    removeItem: [] as [string][],
    clear: 0,
  };

  const mockStorage = {
    getItem(key: string) {
      calls.getItem.push([key]);
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
    },
    setItem(key: string, value: string) {
      calls.setItem.push([key, String(value)]);
      store[key] = String(value);
    },
    removeItem(key: string) {
      calls.removeItem.push([key]);
      delete store[key];
    },
    clear() {
      calls.clear++;
      Object.keys(store).forEach(k => delete store[k]);
    },
    key(i: number) { return Object.keys(store)[i] ?? null; },
    get length() { return Object.keys(store).length; }
  } as any as Storage;

  // Redefine window.localStorage and globalThis.localStorage to our mock
  Object.defineProperty(window, 'localStorage', {
    value: mockStorage,
    configurable: true,
  });
  Object.defineProperty(globalThis as any, 'localStorage', {
    value: mockStorage,
    configurable: true,
  });

  return { store, calls, mockStorage };
}

describe('FiltersService', () => {
  const KEYS = {
    configs: 'da.filters.configs',
    recent: 'da.filters.recent',
  } as const;

  let service: FiltersService;
  let ls: ReturnType<typeof createLocalStorageMock>;

  beforeEach(() => {
    // fresh mock localStorage, then set up TestBed and inject service per test
    ls = createLocalStorageMock();
    TestBed.configureTestingModule({ providers: [FiltersService] });
    service = TestBed.inject(FiltersService);
  });

  afterEach(() => {
    // nothing to restore because we redefine localStorage per test
  });

  it('should create with default signals and no saved configs', () => {
    expect(service).toBeTruthy();

    expect(service.searchText()).toBe('');
    expect(service.customQuery()).toBe('');
    expect(service.selectedConfigName()).toBeNull();

    expect(service.savedConfigs()).toEqual([]);
  });

  it('should not crash when recent state is present in localStorage', () => {
    // Ensure presence of recent state does not throw
    TestBed.resetTestingModule();
    ls = createLocalStorageMock();
    ls.store[KEYS.recent] = JSON.stringify({ searchText: 'hello', query: 'q', selectedConfigName: 'Cfg' });

    TestBed.configureTestingModule({ providers: [FiltersService] });
    expect(() => TestBed.inject(FiltersService)).not.toThrow();
  });

  it('loadConfigs should handle missing or invalid JSON gracefully', () => {
    // Missing
    expect(service.savedConfigs()).toEqual([]);

    // Invalid JSON
    TestBed.resetTestingModule();
    ls = createLocalStorageMock();
    ls.store[KEYS.configs] = '{not valid json';

    TestBed.configureTestingModule({ providers: [FiltersService] });
    service = TestBed.inject(FiltersService);

    expect(service.savedConfigs()).toEqual([]);
  });

  it('saveConfig should add a new config and persist it with ISO dates', () => {
    // set current signals
    service.searchText.set('abc');
    service.customQuery.set('type:view');

    const range: DateRange = { from: new Date('2025-01-01T00:00:00Z'), to: new Date('2025-01-31T23:59:59Z') };

    service.saveConfig('Cfg1', range);

    const saved = service.savedConfigs();
    expect(saved.length).toBe(1);

    const cfg = saved[0];
    expect(cfg.name).toBe('Cfg1');
    expect(cfg.searchText).toBe('abc');
    expect(cfg.query).toBe('type:view');
    expect(cfg.dateRange).toEqual({ from: range.from.toISOString(), to: range.to.toISOString() });

    // selected
    expect(service.selectedConfigName()).toBe('Cfg1');

    // persisted to localStorage
    expect(localStorage.getItem(KEYS.configs)).toBe(JSON.stringify(saved));
  });

  it('saveConfig should update existing config when name matches', () => {
    // initial save
    service.searchText.set('one');
    service.customQuery.set('q1');
    service.saveConfig('Cfg1');

    // update values
    service.searchText.set('two');
    service.customQuery.set('q2');
    service.saveConfig('Cfg1');

    const saved = service.savedConfigs();
    expect(saved.length).toBe(1); // still one
    expect(saved[0]).toMatchObject({ name: 'Cfg1', searchText: 'two', query: 'q2' });
  });

  it('loadConfig should set signals and return the config when found', () => {
    service.searchText.set('x');
    service.customQuery.set('y');
    service.saveConfig('CfgA');

    const loaded = service.loadConfig('CfgA');
    expect(loaded).not.toBeNull();
    expect(service.searchText()).toBe('x');
    expect(service.customQuery()).toBe('y');
    expect(service.selectedConfigName()).toBe('CfgA');
  });

  it('loadConfig should return null and not change signals when not found', () => {
    const prev = { st: service.searchText(), q: service.customQuery(), sel: service.selectedConfigName() };
    const loaded = service.loadConfig('Missing');
    expect(loaded).toBeNull();
    expect(service.searchText()).toBe(prev.st);
    expect(service.customQuery()).toBe(prev.q);
    expect(service.selectedConfigName()).toBe(prev.sel);
  });

  it('deleteConfig should remove a config, persist, and clear selection if it was selected', () => {
    service.searchText.set('s');
    service.customQuery.set('q');
    service.saveConfig('Cfg1');
    service.saveConfig('Cfg2');

    // Select Cfg2
    service.loadConfig('Cfg2');
    expect(service.selectedConfigName()).toBe('Cfg2');

    // Delete selected
    service.deleteConfig('Cfg2');

    const names = service.savedConfigs().map(c => c.name);
    expect(names).toEqual(['Cfg1']);
    expect(service.selectedConfigName()).toBeNull();

    // persisted
    const cfgSave = ls.calls.setItem.find(c => c[0] === KEYS.configs);
    expect(cfgSave?.[1]).toBe(JSON.stringify(service.savedConfigs()));
  });

});
