import { Injectable, signal, effect } from '@angular/core';
import { DateRange } from './DataService';

export interface FilterConfig {
  name: string;
  searchText: string;
  query: string;
  dateRange?: { from: string; to: string }; // ISO strings for persistence
}

@Injectable({ providedIn: 'root' })
export class FiltersService {
  private readonly STORAGE_KEYS = {
    configs: 'da.filters.configs',
    recent: 'da.filters.recent',
  } as const;

  // signals for current state
  readonly searchText = signal<string>('');
  readonly customQuery = signal<string>('');
  readonly selectedConfigName = signal<string | null>(null);

  // list of saved configs
  readonly savedConfigs = signal<FilterConfig[]>(this.loadConfigs());

  constructor() {
    // restore recent state
    const recentRaw = localStorage.getItem(this.STORAGE_KEYS.recent);
    if (recentRaw) {
      try {
        const recent = JSON.parse(recentRaw) as Partial<FilterConfig & { selectedConfigName?: string | null }>;
        if (typeof recent.searchText === 'string') this.searchText.set(recent.searchText);
        if (typeof recent.query === 'string') this.customQuery.set(recent.query);
        if (recent.selectedConfigName) this.selectedConfigName.set(recent.selectedConfigName);
      } catch {
        // ignore
      }
    }

    // Persist recent state whenever relevant signals change
    effect(() => {
      const toSave = {
        searchText: this.searchText(),
        query: this.customQuery(),
        selectedConfigName: this.selectedConfigName(),
      };
      localStorage.setItem(this.STORAGE_KEYS.recent, JSON.stringify(toSave));
    });
  }

  saveConfig(name: string, dateRange?: DateRange): void {
    const cfg: FilterConfig = {
      name,
      searchText: this.searchText(),
      query: this.customQuery(),
      dateRange: dateRange ? { from: dateRange.from.toISOString(), to: dateRange.to.toISOString() } : undefined,
    };
    const list = this.savedConfigs();
    const idx = list.findIndex(c => c.name === name);
    if (idx >= 0) list[idx] = cfg; else list.push(cfg);
    this.savedConfigs.set([...list]);
    this.persistConfigs();
    this.selectedConfigName.set(name);
  }

  loadConfig(name: string): FilterConfig | null {
    const cfg = this.savedConfigs().find(c => c.name === name) || null;
    if (cfg) {
      this.searchText.set(cfg.searchText || '');
      this.customQuery.set(cfg.query || '');
      this.selectedConfigName.set(cfg.name);
    }
    return cfg;
  }

  deleteConfig(name: string): void {
    const list = this.savedConfigs().filter(c => c.name !== name);
    this.savedConfigs.set(list);
    this.persistConfigs();
    if (this.selectedConfigName() === name) this.selectedConfigName.set(null);
  }

  private persistConfigs(): void {
    localStorage.setItem(this.STORAGE_KEYS.configs, JSON.stringify(this.savedConfigs()));
  }

  private loadConfigs(): FilterConfig[] {
    const raw = localStorage.getItem(this.STORAGE_KEYS.configs);

    console.log('raw')
    console.log(raw)
    if (!raw) return [];
    try { return JSON.parse(raw) as FilterConfig[]; } catch { return []; }
  }
}
