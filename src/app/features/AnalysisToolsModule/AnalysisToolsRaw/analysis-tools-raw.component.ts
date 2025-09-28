import {ChangeDetectionStrategy, Component, effect, inject, OnInit, signal} from '@angular/core';
import {TableModule} from 'primeng/table';

import {ProgressSpinner} from 'primeng/progressspinner';
import {ButtonDirective, ButtonIcon, ButtonLabel} from 'primeng/button';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {DataService} from '../../../core/services/DataService';
import {AllCommunityModule, ModuleRegistry} from 'ag-grid-community';
import {PageHeaderComponent} from '../../shared/components/shared-globally/PageHeaderComponent/PageHeaderComponent';
import {DataExportationService} from '../../../core/services/DataExportationService';
import {MenuItem} from 'primeng/api';
import {PivotTableComponentComponent} from '../../shared/components/analysis/PivotTableComponent/pivot-table-component.component';
import {GroupedTableComponentComponent} from '../../shared/components/analysis/GroupedTableComponent/grouped-table-component.component';
import {AnalysisCardsComponentComponent} from '../../shared/components/analysis/AnalysisCardsComponent/analysis-cards-component.component';
import {
  GroupAndPivotDrawerComponent
} from '../../shared/components/analysis/GroupAndPivotDrawerComponent/group-and-pivot-drawer-component';

ModuleRegistry.registerModules([AllCommunityModule]);


@Component({
  selector: 'app-analysis-tools',
  templateUrl: './analysis-tools-raw.component.html',
  imports: [TableModule, ProgressSpinner, ButtonDirective, ButtonIcon, ButtonLabel, ReactiveFormsModule, FormsModule, PageHeaderComponent, PivotTableComponentComponent, GroupedTableComponentComponent, AnalysisCardsComponentComponent, GroupAndPivotDrawerComponent,],
  providers: [],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./analysis-tools-raw.component.scss']
})
export class AnalysisToolsRawComponent implements OnInit {

  groupColumnDefs: any[] = [];
  groupRowData: any[] = [];
  domLayout: 'autoHeight' = 'autoHeight';
  pivotColumnDefs: any[] = [];
  pivotRowData: any[] = [];
  filters!: Filter[];
  dimensionOptions: { label: string; value: string }[] = [];
  measureOptions: { label: string; value: string }[] = [];
  visible = signal(false);
  groupTableLoaded: boolean = true;
  pivotTableLoaded: boolean = true;

  totalEvents = 0;
  averageDuration = '0ms';
  uniqueUsers = 0;

  items: MenuItem[] | undefined;
  pivotItems: MenuItem[] | undefined;
  private dataService = inject(DataService);
  public data = this.dataService.data;
  loading = this.dataService.loading;
  error = this.dataService.error;
  private dataExportationService = inject(DataExportationService);


  private dataGroupFormValue: any;
  private pivotTableFormValue: any;

  constructor() {


    this.items = [{
      label: 'Export as PDF', command: () => {
        this.exportGroupedTable('pdf');
      }
    }, {
      label: 'Export as Excel', command: () => {
        this.exportGroupedTable('xlsx');
      }
    }, {
      label: 'Export as CSV', command: () => {
        this.exportGroupedTable('csv');
      }
    }]

    this.pivotItems = [{
      label: 'Export as PDF', command: () => {
        this.exportPivotTable('pdf');
      }
    }, {
      label: 'Export as Excel', command: () => {
        this.exportPivotTable('xlsx');
      }
    }, {
      label: 'Export as CSV', command: () => {
        this.exportPivotTable('csv');
      }
    }]

    effect(() => {
      const records = this.data();
      this.buildSelectOptions(records);
      if (records && records.length > 0) {
        this.fetchCardStatistics();
        this.groupData();
        this.createPivotTable();
      }
    });
  }

  onGroupSubmit(formValue: any) {
    this.dataGroupFormValue = formValue;
    this.groupData();
  }

  onPivotSubmit(formValue: any) {
    this.pivotTableFormValue = formValue;
    this.createPivotTable();
  }

  async ngOnInit() {

    if (this.data() && this.data().length > 0) {
      this.fetchCardStatistics();
      this.groupData();
      this.createPivotTable();
    }
  }

  groupData() {

    // this.groupTableLoaded = false;

    if (!this.dataGroupFormValue) {
      console.warn('Form values not initialized');
      return;
    }
      const {groupBy: dimension, aggregation, measure} = this.dataGroupFormValue;


    if (!dimension) {
      alert('Please select a dimension to group by');
      return;
    }

    const groupedData: Record<string, any[]> = {};

    this.data().forEach((item: any) => {
      const key = item?.[dimension] ?? 'Unknown';
      if (!groupedData[key]) {
        groupedData[key] = [];
      }
      groupedData[key].push(item);
    });

    // Apply aggregation
    const result: any[] = [];
    for (const key in groupedData) {
      const group = groupedData[key];
      let value: number = 0;

      switch (aggregation) {
        case 'count':
          value = group.length;
          break;
        case 'sum':
          value = group.reduce((sum: number, item: any) => sum + (Number(item?.[measure]) || 0), 0);
          break;
        case 'avg':
          const sum = group.reduce((total: number, item: any) => total + (Number(item?.[measure]) || 0), 0);
          value = group.length ? sum / group.length : 0;
          break;
        case 'min':
          value = Math.min(...group.map((item: any) => Number(item?.[measure]) || 0));
          break;
        case 'max':
          value = Math.max(...group.map((item: any) => Number(item?.[measure]) || 0));
          break;
      }

      result.push({
        [dimension]: key, value: Math.round(value * 100) / 100
      });
    }

    // Create grouped grid
    const columnDefs = [{headerName: dimension, field: dimension}, {
      headerName: String(aggregation).toUpperCase(), field: 'value'
    }];

    this.groupColumnDefs = [...columnDefs];
    this.groupRowData = [...result];
    this.groupTableLoaded = true;

  }


  createPivotTable() {

    if (!this.pivotTableFormValue) {
      console.warn('Form values not initialized');
      return;
    }

    const {rowDimension, columnDimension, valueMeasure} = this.pivotTableFormValue;


    if (!rowDimension) {
      alert('Please select at least a row dimension');
      return;
    }

    // Group data by row and column dimensions
    const pivotData: any = {};
    const columnValues = new Set();

    this.data().forEach((item: any) => {
      const rowValue = item[rowDimension] || 'Unknown';
      const colValue = columnDimension ? (item[columnDimension] || 'Unknown') : 'Total';

      // Add to column values set
      if (columnDimension) columnValues.add(colValue);

      if (!pivotData[rowValue]) {
        pivotData[rowValue] = {};
      }

      if (!pivotData[rowValue][colValue]) {
        pivotData[rowValue][colValue] = {count: 0, sum: 0};
      }

      pivotData[rowValue][colValue].count += 1;
      if (valueMeasure !== 'count') {
        pivotData[rowValue][colValue].sum += Number(item?.[valueMeasure]) || 0;
      }
    });

    const columnDefs: any = [{headerName: rowDimension, field: rowDimension, pinned: 'left'}];

    const columnArray: any = columnDimension ? Array.from(columnValues) : ['Total'];
    columnArray.forEach((col: string | number) => {
      columnDefs.push({
        headerName: col, valueGetter: (params: { data: { [x: string]: any; }; }) => {
          const rowValue = params.data[rowDimension];
          const cellData = pivotData[rowValue] && pivotData[rowValue][col];
          return cellData ? (valueMeasure === 'count' ? cellData.count : cellData.sum) : 0;
        }
      });
    });

    // Add total column only when there is a column dimension (to provide row totals)
    if (columnDimension) {
      columnDefs.push({
        headerName: 'Total', valueGetter: (params: { data: { [x: string]: any; }; }) => {
          const rowValue = params.data[rowDimension];
          let total = 0;
          for (const col in pivotData[rowValue]) {
            total += valueMeasure === 'count' ? pivotData[rowValue][col].count : pivotData[rowValue][col].sum;
          }
          return total;
        }
      });
    }

    // Prepare row data
    const rowData = Object.keys(pivotData).map(rowValue => {
      return {[rowDimension]: rowValue};
    });


    this.pivotColumnDefs = [...columnDefs];
    this.pivotRowData = [...rowData];
    this.pivotTableLoaded = true;


  }

  toggleFilterVisibility() {
    this.visible.update(v => !v);
  }

  exportPivotTable(type: 'pdf' | 'xlsx' | 'csv' = 'pdf') {
    // Build column headers and row data from current grid data
    let cols: string[] = this.pivotColumnDefs.map((item: any) => {
      if (item['headerName'] && String(item['headerName']).toLowerCase() !== 'actions') {
        return String(item['field'] ?? '').toUpperCase();
      } else {
        return ''
      }
    });

    cols = cols.filter(item => item !== '' && item !== undefined);

    const view = this.pivotRowData;

    if (!view || view.length === 0) return;

    const rowKeys: string[] = Object.keys(view[0] as any);

    // rows for PDF/Excel (matrix)
    const matrix: (string | number)[][] = [];
    // rows for CSV/XLSX JSON form
    const jsonRows: Record<string, any>[] = [];

    view.forEach((row: any) => {
      const temp: (string | number)[] = [];
      const jsonRow: Record<string, any> = {};
      cols.forEach(colKey => {
        rowKeys.forEach(key => {
          if (colKey === key.toUpperCase()) {
            temp.push(row[key]);
            jsonRow[key] = row[key];
          }
        })
      })
      matrix.push(temp);
      jsonRows.push(jsonRow);
    })

    if (type === 'pdf') {
      this.dataExportationService.exportToPdf(cols, matrix as string[][], 'Pivot_Table_Data.pdf');
    } else if (type === 'xlsx') {
      this.dataExportationService.exportDataXlsx(jsonRows, 'Pivot_Table_Data');
    } else if (type === 'csv') {
      this.dataExportationService.exportToCsv(jsonRows as any, 'Pivot_Table_Data');
    }
  }

  exportGroupedTable(type: 'pdf' | 'xlsx' | 'csv' = 'pdf') {
    // Build column headers and row data from current grid data
    let cols: string[] = this.groupColumnDefs.map((item: any) => {
      if (item['headerName'] && String(item['headerName']).toLowerCase() !== 'actions') {
        return String(item['field'] ?? '').toUpperCase();
      } else {
        return ''
      }
    });

    cols = cols.filter(item => item !== '' && item !== undefined);

    const view = this.groupRowData;
    if (!view || view.length === 0) return;

    const rowKeys: string[] = Object.keys(view[0] as any);

    // rows for PDF/Excel (matrix)
    const matrix: (string | number)[][] = [];
    // rows for CSV/XLSX JSON form
    const jsonRows: Record<string, any>[] = [];

    view.forEach((row: any) => {
      const temp: (string | number)[] = [];
      const jsonRow: Record<string, any> = {};
      cols.forEach(colKey => {
        rowKeys.forEach(key => {
          if (colKey === key.toUpperCase()) {
            temp.push(row[key]);
            jsonRow[key] = row[key];
          }
        })
      })
      matrix.push(temp);
      jsonRows.push(jsonRow);
    })

    if (type === 'pdf') {
      this.dataExportationService.exportToPdf(cols, matrix as string[][], 'Grouped_Table.pdf');
    } else if (type === 'xlsx') {
      this.dataExportationService.exportDataXlsx(jsonRows, 'Grouped_Table');
    } else if (type === 'csv') {
      this.dataExportationService.exportToCsv(jsonRows as any, 'Grouped_Table');
    }
  }

  private buildSelectOptions(records: any[]) {
    const defaultDims = ['platform', 'country', 'device_tier', 'event_name', 'release_channel', 'source', 'day', 'app_version', 'network_type'];
    const first = records?.[0] ?? {};
    const keys = Object.keys(first || {});

    const dims = defaultDims.filter(k => k in first).concat(keys.filter(k => typeof first[k] === 'string' && !defaultDims.includes(k)));

    // Numeric measures present in data
    const numericCandidates = ['count', 'duration_ms', 'revenue_usd', 'purchase_count'];
    const measures = numericCandidates.filter(k => k in first);

    this.dimensionOptions = [{label: '-- Select Dimension --', value: ''}, ...dims.map(k => ({
      label: this.pretty(k), value: k
    }))];

    this.measureOptions = [{
      label: 'Count', value: 'count'
    }, ...measures.filter(m => m !== 'count').map(k => ({label: this.pretty(k), value: k}))];
  }

  private pretty(key: string) {
    return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  private fetchCardStatistics() {

    const data = this.data();
    this.totalEvents = data.length;

    if (this.totalEvents === 0) {
      this.averageDuration = '0.00 ms';
      this.uniqueUsers = 0;
      return;
    }

    let totalDuration = 0;
    const uniqueUserIds = new Set();

    data.forEach((event: any) => {
      totalDuration += event.duration_ms || 0;
      if (event.user_pseudo_id) {
        uniqueUserIds.add(event.user_pseudo_id);
      }
    });

    this.averageDuration = (totalDuration / this.totalEvents).toFixed(2) + ' ms';
    this.uniqueUsers = uniqueUserIds.size;

  }
}

interface Filter {
  name: string,
  code: string
}
