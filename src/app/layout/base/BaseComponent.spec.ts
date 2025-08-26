import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { BaseComponent } from './BaseComponent';
import { Router, NavigationEnd } from '@angular/router';
import { Subject } from 'rxjs';

// Mock flowbite init
jest.mock('flowbite', () => ({ initFlowbite: jest.fn() }));
import { initFlowbite } from 'flowbite';

class RouterStub {
  public events = new Subject<any>();
  navigate = jest.fn().mockResolvedValue(true);
  parseUrl = (url: string) => new (class { queryParams: any; constructor() { this.queryParams = {}; } })();
}

describe('BaseComponent', () => {
  beforeAll(() => {
    // Ensure real timers for Angular TestBed/Zone operations
    jest.useRealTimers();
  });
  let component: BaseComponent;
  let fixture: ComponentFixture<BaseComponent>;
  let router: RouterStub;

  beforeEach(async () => {
    router = new RouterStub();

    await TestBed.configureTestingModule({
      imports: [BaseComponent],
      providers: [{ provide: Router, useValue: router }]
    }).compileComponents();

    fixture = TestBed.createComponent(BaseComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('updates currentUrl on NavigationEnd (from constructor and ngOnInit)', () => {
    // Constructor subscription
    const nav1 = new NavigationEnd(1, '/foo', '/foo');
    router.events.next(nav1);
    expect(component['currentUrl']).toBe('/foo');

    // ngOnInit adds another subscription; emit again
    component.ngOnInit();
    const nav2 = new NavigationEnd(2, '/bar?x=1', '/bar?x=1');
    router.events.next(nav2);
    expect(component['currentUrl']).toBe('/bar?x=1');
  });

  it('isActive returns true when route matches and no query params', () => {
    component['currentUrl'] = '/data-explorer/raw-events';
    expect(component.isActive(['data-explorer', 'raw-events'])).toBe(true);
    expect(component.isActive(['visualization'])).toBe(false);
  });

  it('isActive validates query params when provided', () => {
    // Mock parseUrl to return query params
    router.parseUrl = (url: string) => ({ queryParams: { a: '1', b: 'x' } } as any);
    component['currentUrl'] = '/path/here?a=1&b=x';

    expect(component.isActive(['path', 'here'], { a: '1' })).toBe(true);
    expect(component.isActive(['path', 'here'], { a: '1', b: 'x' })).toBe(true);
    expect(component.isActive(['path', 'here'], { a: '2' })).toBe(false);
    expect(component.isActive(['nope'], { a: '1' })).toBe(false);
  });

  it('ngAfterViewChecked initializes flowbite only once when toggle elements exist', () => {
    // Mock DOM: first call returns an element, subsequent calls still return element but component guards
    const querySpy = jest.spyOn(document, 'querySelector');
    querySpy.mockReturnValue({} as any);

    expect((initFlowbite as jest.Mock).mock.calls.length).toBe(0);

    component.ngAfterViewChecked();
    expect(initFlowbite).toHaveBeenCalledTimes(1);

    // Calling again should NOT re-initialize
    component.ngAfterViewChecked();
    expect(initFlowbite).toHaveBeenCalledTimes(1);

    querySpy.mockRestore();
  });

  it('initializeNavigation parses allowedModules and sets navItems', () => {
    const data = JSON.stringify(['moduleA', 'moduleB']);
    component.initializeNavigation(data);

    expect(component.allowedModules).toEqual(['moduleA', 'moduleB']);
    expect(Array.isArray(component.navItems)).toBe(true);
    expect(component.navItems.length).toBeGreaterThan(0);
  });

  it('hasRequiredModules returns true when any required module is allowed', () => {
    component.allowedModules = ['m1', 'm2'];
    expect(component.hasRequiredModules(['x', 'm2'])).toBe(true);
    expect(component.hasRequiredModules(['x', 'y'])).toBe(false);
    // Defensive for undefined
    expect(component.hasRequiredModules(undefined as any)).toBe(false);
  });

  it('hasAnyChildAccess checks children using hasRequiredModules', () => {
    component.allowedModules = ['read'];
    const children = [
      { title: 'A', requiredModules: ['write'] },
      { title: 'B', requiredModules: ['read'] }
    ];
    expect(component.hasAnyChildAccess(children)).toBe(true);
    expect(component.hasAnyChildAccess([{ requiredModules: ['none'] }])).toBe(false);
    expect(component.hasAnyChildAccess(undefined as any)).toBe(false);
  });

  it('logout navigates to root', async () => {
    await component.logout();
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('waitForAssignedModules emits when localStorage is set', fakeAsync(() => {
    // Clear then set after some ticks
    localStorage.removeItem('assignedModules');

    const emissions: any[] = [];
    const sub = component.waitForAssignedModules(10).subscribe(v => emissions.push(v));

    // No emission yet
    tick(9);
    expect(emissions.length).toBe(0);

    // Set value and allow interval to tick
    localStorage.setItem('assignedModules', JSON.stringify(['a']));
    tick(20);

    expect(emissions.length).toBe(1);
    expect(emissions[0]).toBe(JSON.stringify(['a']));

    sub.unsubscribe();
  }));
});
