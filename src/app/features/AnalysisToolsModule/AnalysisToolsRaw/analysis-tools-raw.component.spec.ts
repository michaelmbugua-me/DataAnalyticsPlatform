import {ComponentFixture, TestBed} from '@angular/core/testing';
import {AnalysisToolsRawComponent} from './analysis-tools-raw.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import {of} from 'rxjs';

describe('AnalysisToolsRawComponent', () => {

  let component: AnalysisToolsRawComponent;
  let fixture: ComponentFixture<AnalysisToolsRawComponent>;


  const mockDataService = {
    data: jest.fn().mockReturnValue([]),
    loading: of(false),
    error: of(null)
  };

  const mockDataExportationService = {
    exportToPdf: jest.fn(),
    exportDataXlsx: jest.fn(),
    exportToCsv: jest.fn()
  };

  beforeEach(async () => {

    await TestBed.configureTestingModule({
      declarations: [], imports: [HttpClientTestingModule, AnalysisToolsRawComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(AnalysisToolsRawComponent);
    component = fixture.componentInstance;

  });

  afterEach(() => {
    jest.clearAllMocks();
    fixture.destroy();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      expect(component.groupColumnDefs).toEqual([]);
      expect(component.groupRowData).toEqual([]);
      expect(component.pivotColumnDefs).toEqual([]);
      expect(component.pivotRowData).toEqual([]);
      expect(component.visible()).toBe(false);
      expect(component.totalEvents).toBe(0);
      expect(component.averageDuration).toBe('0ms');
      expect(component.uniqueUsers).toBe(0);
    });

    it('should initialize menu items', () => {
      expect(component.items).toBeDefined();
      expect(component.items?.length).toBe(3);
      expect(component.pivotItems).toBeDefined();
      expect(component.pivotItems?.length).toBe(3);
    });
  });
  describe('toggleFilterVisibility', () => {
    it('should toggle visible signal', () => {
      const initialValue = component.visible();
      component.toggleFilterVisibility();
      expect(component.visible()).toBe(!initialValue);

      component.toggleFilterVisibility();
      expect(component.visible()).toBe(initialValue);
    });
  });

  describe('onGroupSubmit', () => {
    it('should set dataGroupFormValue and call groupData', () => {
      const groupDataSpy = jest.spyOn(component as any, 'groupData');
      const formValue = { groupBy: 'platform', aggregation: 'count', measure: 'count' };

      component.onGroupSubmit(formValue);

      expect((component as any).dataGroupFormValue).toEqual(formValue);
      expect(groupDataSpy).toHaveBeenCalled();
    });
  });

  describe('onPivotSubmit', () => {
    it('should set pivotTableFormValue and call createPivotTable', () => {
      const createPivotTableSpy = jest.spyOn(component as any, 'createPivotTable');
      const formValue = { rowDimension: 'platform', columnDimension: 'country', valueMeasure: 'count' };

      component.onPivotSubmit(formValue);

      expect((component as any).pivotTableFormValue).toEqual(formValue);
      expect(createPivotTableSpy).toHaveBeenCalled();
    });
  });

  describe('exportPivotTable', () => {
    it('should call export service with correct parameters for PDF', () => {
      component.pivotColumnDefs = [{ headerName: 'Platform', field: 'platform' }];
      component.pivotRowData = [{ platform: 'iOS' }];

      component.exportPivotTable('pdf');

      expect(mockDataExportationService.exportToPdf).toHaveBeenCalledWith(
        ['PLATFORM'],
        expect.any(Array),
        'Pivot_Table_Data.pdf'
      );
    });

    it('should not export if no row data', () => {
      component.pivotRowData = [];
      component.exportPivotTable('pdf');

      expect(mockDataExportationService.exportToPdf).not.toHaveBeenCalled();
    });
  });

  describe('exportGroupedTable', () => {
    it('should call export service with correct parameters for Excel', () => {
      component.groupColumnDefs = [{ headerName: 'Platform', field: 'platform' }];
      component.groupRowData = [{ platform: 'iOS' }];

      component.exportGroupedTable('xlsx');

      expect(mockDataExportationService.exportDataXlsx).toHaveBeenCalledWith(
        expect.any(Array),
        'Grouped_Table'
      );
    });
  });

  describe('buildSelectOptions', () => {
    it('should build dimension and measure options from data', () => {
      const records = [
        { platform: 'iOS', duration_ms: 100, user_pseudo_id: '123' }
      ];

      (component as any).buildSelectOptions(records);

      expect(component.dimensionOptions.length).toBeGreaterThan(1);
      expect(component.measureOptions.length).toBeGreaterThan(1);
      expect(component.dimensionOptions.some(opt => opt.value === 'platform')).toBe(true);
      expect(component.measureOptions.some(opt => opt.value === 'duration_ms')).toBe(true);
    });

    it('should handle empty data gracefully', () => {
      (component as any).buildSelectOptions([]);

      expect(component.dimensionOptions).toEqual([{ label: '-- Select Dimension --', value: '' }]);
      expect(component.measureOptions).toEqual([{ label: 'Count', value: 'count' }]);
    });
  });

  describe('fetchCardStatistics', () => {
    it('should calculate correct statistics', () => {
      const data = [
        { duration_ms: 100, user_pseudo_id: 'user1' },
        { duration_ms: 200, user_pseudo_id: 'user1' },
        { duration_ms: 300, user_pseudo_id: 'user2' }
      ];

      mockDataService.data.mockReturnValue(data);
      (component as any).fetchCardStatistics();

      expect(component.totalEvents).toBe(3);
      expect(component.averageDuration).toBe('200.00 ms');
      expect(component.uniqueUsers).toBe(2);
    });

    it('should handle empty data', () => {
      mockDataService.data.mockReturnValue([]);
      (component as any).fetchCardStatistics();

      expect(component.totalEvents).toBe(0);
      expect(component.averageDuration).toBe('0.00 ms');
      expect(component.uniqueUsers).toBe(0);
    });
  });

});
