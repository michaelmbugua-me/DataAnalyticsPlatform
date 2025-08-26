import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { DailyRollupsComponent } from './DailyRollupsComponent';
import { DataService } from '../../../core/services/DataService';
import { AgGridAngular } from 'ag-grid-angular';
import { FilterDrawerComponent } from '../../shared/components/FilterDrawerComponent/FilterDrawerComponent';
import { By } from '@angular/platform-browser';
import { signal } from '@angular/core';
import { DailyRollup } from '../../../core/models/DataModels';
import { FormsModule } from '@angular/forms';
import {GridReadyEvent} from 'ag-grid-community';

// Mock the DataService
const mockDataService = {
  filteredDailyRollups: signal<DailyRollup[]>([]),
  error: signal<string | null>(null)
};

// Mock AG Grid component
jest.mock('ag-grid-angular', () => {
  return {
    AgGridAngular: jest.fn().mockImplementation(() => ({
      api: {
        sizeColumnsToFit: jest.fn(),
        setGridOption: jest.fn()
      }
    }))
  };
});

describe('DailyRollupsComponent', () => {
  let component: DailyRollupsComponent;
  let fixture: ComponentFixture<DailyRollupsComponent>;
  let dataService: DataService;

  const mockDailyRollups: any[] = [
    {
      day: '2024-01-01',
      source: 'organic',
      platform: 'iOS',
      app_id: 'com.example.app',
      app_version: '1.0.0',
      release_channel: 'production',
      country: 'US',
      device_tier: 'high',
      event_group: 'purchase',
      events_count: 100,
      users_count: 50,
      sessions_count: 75,
      revenue_usd: 999.99,
      purchase_count: 25,
      avg_duration_ms: 5000,
      p50_duration_ms: 4500,
      p90_duration_ms: 8000,
      p99_duration_ms: 12000
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule, DailyRollupsComponent],
      providers: [
        { provide: DataService, useValue: mockDataService }
      ]
    })
      .overrideComponent(DailyRollupsComponent, {
        remove: { imports: [AgGridAngular, FilterDrawerComponent] },
        add: { imports: [] }
      })
      .compileComponents();

    fixture = TestBed.createComponent(DailyRollupsComponent);
    component = fixture.componentInstance;
    dataService = TestBed.inject(DataService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should initialize with empty data signal', () => {
      fixture.detectChanges();
      expect(component.data()).toEqual([]);
    });

    it('should initialize filters in ngOnInit', fakeAsync(() => {
      component.ngOnInit();
      tick();

      expect(component.filters).toEqual([
        {name: 'Today\'s records', code: 'NY'},
        {name: 'This weeks\'s records', code: 'RM'},
        {name: 'This month\'s records', code: 'LDN'},
        {name: 'This year\'s records', code: 'IST'}
      ]);
    }));

    it('should set up grid options correctly', () => {
      expect(component.gridOptions.rowModelType).toBe('clientSide');
      expect(component.gridOptions.pagination).toBe(true);
      expect(component.gridOptions.animateRows).toBe(true);
    });
  });

  describe('Data Binding', () => {
    it('should display data from DataService', () => {
      // Set mock data
      mockDataService.filteredDailyRollups.set(mockDailyRollups);
      fixture.detectChanges();

      expect(component.data()).toEqual(mockDailyRollups);
    });

    it('should handle error state from DataService', () => {
      mockDataService.error.set('Failed to load data');
      fixture.detectChanges();

      expect(component.error()).toBe('Failed to load data');
    });
  });

  describe('Column Definitions', () => {
    it('should have correct column definitions', () => {
      expect(component.columnDefs.length).toBe(19); // Total columns defined

      // Test a few key columns
      const dayColumn = component.columnDefs.find(col => col.field === 'day');
      expect(dayColumn?.headerName).toBe('Day');
      expect(dayColumn?.filter).toBe('agDateColumnFilter');

      const revenueColumn = component.columnDefs.find(col => col.field === 'revenue_usd');
      expect(revenueColumn?.valueFormatter).toBeDefined();

      const eventsCountColumn = component.columnDefs.find(col => col.field === 'events_count');
      expect(eventsCountColumn?.type).toBe('numericColumn');
    });

    // it('should format revenue values correctly', () => {
    //   const revenueColumn = component.columnDefs.find(col => col.field === 'revenue_usd');
    //   const formatter = revenueColumn?.valueFormatter;
    //
    //   if (formatter && typeof formatter === 'function') {
    //     const formattedValue = formatter({ value: 999.99 });
    //     expect(formattedValue).toBe('$999.99');
    //
    //     const zeroValue = formatter({ value: 0 });
    //     expect(zeroValue).toBe('$0.00');
    //
    //     const nullValue = formatter({ value: null });
    //     expect(nullValue).toBe('$0.00');
    //   }
    // });

    // it('should format duration values correctly', () => {
    //   const avgDurationColumn = component.columnDefs.find(col => col.field === 'avg_duration_ms');
    //   const formatter = avgDurationColumn?.valueFormatter;
    //
    //   if (formatter && typeof formatter === 'function') {
    //     const formattedValue = formatter({ value: 5000 });
    //     expect(formattedValue).toBe('5000ms');
    //
    //     const nullValue = formatter({ value: null });
    //     expect(nullValue).toBe('');
    //   }
    // });
  });

  describe('UI Interactions', () => {
    it('should toggle filter visibility', () => {
      expect(component.visible()).toBe(false);

      component.toggleFilterVisibility();
      expect(component.visible()).toBe(true);

      component.toggleFilterVisibility();
      expect(component.visible()).toBe(false);
    });

    it('should call sizeColumnsToFit on grid ready', () => {
      const mockGridReadyEvent = {
        api: {
          sizeColumnsToFit: jest.fn()
        }
      } as unknown as GridReadyEvent;

      component.onGridReady(mockGridReadyEvent);
      expect(mockGridReadyEvent.api.sizeColumnsToFit).toHaveBeenCalled();
    });
  });

  describe('Template Rendering', () => {
    it('should render the AG Grid component', () => {
      fixture.detectChanges();
      const gridElement = fixture.debugElement.query(By.css('ag-grid-angular'));
      expect(gridElement).toBeTruthy();
    });

    it('should render filter button', () => {
      fixture.detectChanges();
      const buttonElement = fixture.debugElement.query(By.css('p-button'));
      expect(buttonElement).toBeTruthy();
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle empty data array', () => {
      mockDataService.filteredDailyRollups.set([]);
      fixture.detectChanges();

      expect(component.data()).toEqual([]);
      // Should not throw errors with empty data
      expect(() => component.ngOnInit()).not.toThrow();
    });

    it('should handle null/undefined values in data', () => {
      const dataWithNulls: any[] = [
        {
          day: '2024-01-01',
          source: null as unknown as string,
          platform: 'iOS',
          app_id: 'com.example.app',
          app_version: '1.0.0',
          release_channel: 'production',
          country: 'US',
          device_tier: 'high',
          event_group: 'purchase',
          events_count: null as unknown as number,
          users_count: 50,
          sessions_count: 75,
          revenue_usd: null as unknown as number,
          purchase_count: 25,
          avg_duration_ms: null as unknown as number,
          p50_duration_ms: 4500,
          p90_duration_ms: 8000,
          p99_duration_ms: 12000
        }
      ];

      mockDataService.filteredDailyRollups.set(dataWithNulls);
      fixture.detectChanges();

      expect(component.data()).toEqual(dataWithNulls);
      // Should not crash with null values
      expect(() => component.ngOnInit()).not.toThrow();
    });
  });
});
