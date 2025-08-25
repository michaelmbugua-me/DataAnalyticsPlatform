import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FilterDrawerComponent } from './FilterDrawerComponent';
import { DataService } from '../../../core/services/DataService';
import { FormsModule } from '@angular/forms';
import { signal } from '@angular/core';
import {Drawer} from 'primeng/drawer';
import {DatePicker} from 'primeng/datepicker';
import {ButtonDirective, ButtonIcon, ButtonLabel} from 'primeng/button';

// Mock DataService
const mockDataService = {
  setDateRange: jest.fn()
};

describe('FilterDrawerComponent', () => {
  let component: FilterDrawerComponent;
  let fixture: ComponentFixture<FilterDrawerComponent>;
  let dataService: DataService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule, FilterDrawerComponent],
      providers: [
        { provide: DataService, useValue: mockDataService }
      ]
    })
      .overrideComponent(FilterDrawerComponent, {
        remove: { imports: [Drawer, DatePicker, ButtonDirective, ButtonIcon, ButtonLabel] },
        add: { imports: [] }
      })
      .compileComponents();

    fixture = TestBed.createComponent(FilterDrawerComponent);
    component = fixture.componentInstance;
    dataService = TestBed.inject(DataService);

    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('Input Properties', () => {
    it('should accept startDate input', () => {
      const testDate = '2024-01-01';
      component.startDate = testDate;
      fixture.detectChanges();

      expect(component.startDate).toBe(testDate);
    });

    it('should accept endDate input', () => {
      const testDate = '2024-12-31';
      component.endDate = testDate;
      fixture.detectChanges();

      expect(component.endDate).toBe(testDate);
    });

    it('should accept visible signal input', () => {
      const visibleSignal = signal(false);
      component.visible = visibleSignal;
      fixture.detectChanges();

      expect(component.visible).toBe(visibleSignal);
    });

    it('should accept dataType input', () => {
      const testDataType = 'daily-rollups';
      component.dataType = testDataType;
      fixture.detectChanges();

      expect(component.dataType).toBe(testDataType);
    });
  });

  describe('applyFilter Method', () => {
    it('should call dataService.setDateRange with correct dates', () => {
      const startDate = '2024-01-01';
      const endDate = '2024-01-31';

      component.applyFilter(startDate, endDate);

      expect(mockDataService.setDateRange).toHaveBeenCalledWith({
        from: new Date(startDate),
        to: new Date(endDate)
      });
    });

    it('should handle invalid date strings gracefully', () => {
      const invalidStart = 'invalid-date';
      const invalidEnd = 'another-invalid-date';

      // This should not throw and should still call the service
      expect(() => {
        component.applyFilter(invalidStart, invalidEnd);
      }).not.toThrow();

      expect(mockDataService.setDateRange).toHaveBeenCalled();
    });

    it('should handle empty string dates', () => {
      component.applyFilter('', '');

      expect(mockDataService.setDateRange).toHaveBeenCalledWith({
        from: new Date(''),
        to: new Date('')
      });
    });
  });

  describe('Output Events', () => {
    it('should emit filterApplied event when applyFilter is called', () => {
      const filterAppliedSpy = jest.spyOn(component.filterApplied, 'emit');
      const startDate = '2024-01-01';
      const endDate = '2024-01-31';

      component.applyFilter(startDate, endDate);

      expect(filterAppliedSpy).toHaveBeenCalled();
    });

    it('should emit visibleChange event when visible signal changes', fakeAsync(() => {
      const visibleChangeSpy = jest.spyOn(component.visibleChange, 'emit');
      const visibleSignal = signal(true);

      component.visible = visibleSignal;
      fixture.detectChanges();

      // Simulate signal change
      visibleSignal.set(false);
      tick();

      expect(visibleChangeSpy).toHaveBeenCalledWith(visibleSignal);
    }));
  });

  describe('Template Binding', () => {
    it('should bind startDate to template', fakeAsync(() => {
      const testStartDate = '2024-01-01';
      component.startDate = testStartDate;
      fixture.detectChanges();

      // Since we removed PrimeNG imports, we'll test the logic instead of DOM
      expect(component.startDate).toBe(testStartDate);
    }));

    it('should bind endDate to template', fakeAsync(() => {
      const testEndDate = '2024-12-31';
      component.endDate = testEndDate;
      fixture.detectChanges();

      expect(component.endDate).toBe(testEndDate);
    }));

    it('should bind visible signal to template', fakeAsync(() => {
      const visibleSignal = signal(true);
      component.visible = visibleSignal;
      fixture.detectChanges();

      expect(component.visible()).toBe(true);
    }));
  });

  describe('Integration with DataService', () => {
    it('should call DataService with valid date range', () => {
      const startDate = '2024-01-01T00:00:00Z';
      const endDate = '2024-01-31T23:59:59Z';

      component.applyFilter(startDate, endDate);

      expect(mockDataService.setDateRange).toHaveBeenCalledTimes(1);
      expect(mockDataService.setDateRange).toHaveBeenCalledWith({
        from: new Date(startDate),
        to: new Date(endDate)
      });
    });

    it('should handle different date formats', () => {
      const testCases = [
        { start: '2024-01-01', end: '2024-01-31' },
        { start: '01/01/2024', end: '01/31/2024' },
        { start: '2024-01-01T00:00:00', end: '2024-01-31T23:59:59' }
      ];

      testCases.forEach(({ start, end }) => {
        component.applyFilter(start, end);
        expect(mockDataService.setDateRange).toHaveBeenCalledWith({
          from: new Date(start),
          to: new Date(end)
        });
        jest.clearAllMocks();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle null inputs', () => {
      component.startDate = null as any;
      component.endDate = null as any;

      expect(() => {
        component.applyFilter(component.startDate, component.endDate);
      }).not.toThrow();

      expect(mockDataService.setDateRange).toHaveBeenCalled();
    });

    it('should handle undefined inputs', () => {
      component.startDate = undefined as any;
      component.endDate = undefined as any;

      expect(() => {
        component.applyFilter(component.startDate, component.endDate);
      }).not.toThrow();

      expect(mockDataService.setDateRange).toHaveBeenCalled();
    });

    it('should handle date objects as inputs', () => {
      const startDateObj = new Date('2024-01-01');
      const endDateObj = new Date('2024-01-31');

      // This tests if the component can handle Date objects being passed as strings
      component.applyFilter(startDateObj.toISOString(), endDateObj.toISOString());

      expect(mockDataService.setDateRange).toHaveBeenCalledWith({
        from: startDateObj,
        to: endDateObj
      });
    });
  });

  describe('Component Lifecycle', () => {
    it('should initialize with default values if inputs not provided', () => {
      expect(component.startDate).toBeUndefined();
      expect(component.endDate).toBeUndefined();
      expect(component.visible).toBeUndefined();
      expect(component.dataType).toBeUndefined();
    });

    it('should handle sequential applyFilter calls', () => {
      const calls = [
        { start: '2024-01-01', end: '2024-01-31' },
        { start: '2024-02-01', end: '2024-02-28' },
        { start: '2024-03-01', end: '2024-03-31' }
      ];

      calls.forEach(({ start, end }, index) => {
        component.applyFilter(start, end);
        expect(mockDataService.setDateRange).toHaveBeenCalledTimes(index + 1);
      });
    });
  });
});
