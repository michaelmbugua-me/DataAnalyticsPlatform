import {Component, effect, inject, OnInit, signal} from '@angular/core';
import {TableModule} from 'primeng/table';

import {ProgressSpinner} from 'primeng/progressspinner';
import {ButtonDirective, ButtonIcon, ButtonLabel} from 'primeng/button';
import {Select} from 'primeng/select';
import {AgGridAngular} from 'ag-grid-angular';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {Drawer} from 'primeng/drawer';
import {DataService} from '../../../core/services/DataService';


@Component({
  selector: 'app-analysis-tools-daily',
  templateUrl: './analysis-tools-daily.component.html',
  imports: [
    TableModule,
    ProgressSpinner,
    ButtonDirective,
    ButtonIcon,
    ButtonLabel,
    Select,
    AgGridAngular,
    ReactiveFormsModule,
    Drawer,
    FormsModule,
  ],
  providers: [],
  styleUrls: ['./analysis-tools-daily.component.scss']
})
export class AnalysisToolsDailyComponent implements OnInit {

  private dataService = inject(DataService);

  public data = this.dataService.dailyRollups;
  loading = this.dataService.loading;
  error = this.dataService.error;

  groupColumnDefs: any[] = [];
  groupRowData: any[] = [];
  groupDefaultColDef = { sortable: true, filter: true, resizable: true };
  domLayout: 'autoHeight' = 'autoHeight';

  pivotColumnDefs: any[] = [];
  pivotRowData: any[] = [];
  pivotDefaultColDef = { sortable: true, filter: true, resizable: true };


  filters!: Filter[];

  // Dynamic select options derived from data
  dimensionOptions: { label: string; value: string }[] = [];
  measureOptions: { label: string; value: string }[] = [];

  visible = signal(false);

  dataGroupForm!: FormGroup;
  pivotTableForm!: FormGroup;


  groupTableLoaded: boolean = true;
  pivotTableLoaded: boolean = true;


  // Card Statistics
  totalEvents = 0;
  averageDuration = '0ms';
  uniqueUsers = 0;
  // Card Statistics

  constructor(private fb: FormBuilder) {
    this.dataGroupForm = fb.group({
      groupBy: ['country', Validators.required],
      aggregation: ['count', Validators.required],
      measure: ['events_count', Validators.required]
    });

    this.pivotTableForm = fb.group({
      rowDimension: ['platform', Validators.required],
      columnDimension: [''],
      valueMeasure: ['events_count', Validators.required]
    });

    // React to data arrivals/changes to build options and initialize tables
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

  private buildSelectOptions(records: any[]) {
    const defaultDims = ['day','source','platform','app_id','app_version','release_channel','country','device_tier','event_group'];
    const first = records?.[0] ?? {};
    const keys = Object.keys(first || {});

    const dims = defaultDims.filter(k => k in first).concat(
      keys.filter(k => typeof first[k] === 'string' && !defaultDims.includes(k))
    );

    // Inject a user-friendly alias: Event Type -> event_name (resolved later to event_group if needed)
    const withAlias = [...dims];
    if (!('event_name' in first) && ('event_group' in first)) {
      // Add a synthetic option value 'event_name' so the rest of the UI stays consistent
      withAlias.push('event_name');
    }

    // Numeric measures present in daily rollups
    const numericCandidates = [
      'events_count','users_count','sessions_count',
      'avg_duration_ms','p50_duration_ms','p90_duration_ms','p99_duration_ms',
      'http_error_rate','crash_rate_per_1k_sessions',
      'revenue_usd','purchase_count'
    ];
    const measures = numericCandidates.filter(k => k in first);

    this.dimensionOptions = [{ label: '-- Select Dimension --', value: '' },
      ...withAlias.map(k => ({ label: k === 'event_name' ? 'Event Type' : this.pretty(k), value: k }))
    ];

    this.measureOptions = measures.length
      ? measures.map(k => ({ label: this.pretty(k), value: k }))
      : [{ label: 'Events Count', value: 'events_count' }];
  }

  private pretty(key: string) {
    return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  get dimensionOptionsNoPlaceholder() {
    return this.dimensionOptions.filter(o => !!o.value);
  }

  async ngOnInit() {

    this.filters = [
      {name: 'Today\'s records', code: 'NY'},
      {name: 'This weeks\'s records', code: 'RM'},
      {name: 'This month\'s records', code: 'LDN'},
      {name: 'This year\'s records', code: 'IST'}
    ];

    // If data already present synchronously, ensure cards and views are populated
    if (this.data() && this.data().length > 0) {
      this.fetchCardStatistics();
      this.groupData();
      this.createPivotTable();
    }

  }

  onSubmit() {

    if (!this.dataGroupForm || this.dataGroupForm.invalid) {
      this.dataGroupForm?.markAllAsTouched();
      return;
    }
    this.groupData();
  }

  groupData() {

    this.groupTableLoaded = false;
      const { groupBy: dimension, aggregation, measure } = this.dataGroupForm.value;

    if (!dimension) {
      alert('Please select a dimension to group by');
      return;
    }

    const getDim = (it: any, key: string) => {
      if (key === 'event_name') {
        // Prefer event_name if present; otherwise fall back to event_group (Daily dataset)
        return (it?.event_name ?? it?.event_group ?? 'Unknown');
      }
      return (it?.[key] ?? 'Unknown');
    };

    const groupedData: Record<string, any[]> = {};

    this.data().forEach((item: any) => {
      const key = getDim(item, dimension);
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
        [dimension]: key,
        value: Math.round(value * 100) / 100
      });
    }

    // Create grouped grid
    const columnDefs = [
      { headerName: dimension, field: dimension },
      { headerName: String(aggregation).toUpperCase(), field: 'value' }
    ];

    this.groupColumnDefs = [...columnDefs];
    this.groupRowData = [...result];
    this.groupTableLoaded = true;

  }

  onPivotSubmit() {
    if (!this.pivotTableForm || this.pivotTableForm.invalid) {
      this.pivotTableForm?.markAllAsTouched();
      return;
    }

    this.createPivotTable();





  }

  createPivotTable() {

    const { rowDimension, columnDimension, valueMeasure } = this.pivotTableForm.value;

    if (!rowDimension) {
      alert('Please select at least a row dimension');
      return;
    }

    // Group data by row and column dimensions
    const pivotData: any = {};
    const columnValues = new Set();

    const getDim = (it: any, key: string) => {
      if (!key) return 'Total';
      if (key === 'event_name') {
        return (it?.event_name ?? it?.event_group ?? 'Unknown');
      }
      return (it?.[key] ?? 'Unknown');
    };

    this.data().forEach((item: any) => {
      const rowValue = getDim(item, rowDimension);
      const colValue = columnDimension ? getDim(item, columnDimension) : 'Total';

      // Add to column values set
      if (columnDimension) columnValues.add(colValue);

      if (!pivotData[rowValue]) {
        pivotData[rowValue] = {};
      }

      if (!pivotData[rowValue][colValue]) {
        pivotData[rowValue][colValue] = { count: 0, sum: 0 };
      }

      // Update measures
      pivotData[rowValue][colValue].count += 1;
      if (valueMeasure !== 'count') {
        pivotData[rowValue][colValue].sum += Number(item?.[valueMeasure]) || 0;
      }
    });

    // Prepare column definitions
    const columnDefs: any = [
      { headerName: rowDimension, field: rowDimension, pinned: 'left' }
    ];

    // Add column dimension values as columns
    const columnArray: any = columnDimension ? Array.from(columnValues) : ['Total'];
    columnArray.forEach((col: string | number) => {
      columnDefs.push({
        headerName: col,
        valueGetter: (params: { data: { [x: string]: any; }; }) => {
          const rowValue = params.data[rowDimension];
          const cellData = pivotData[rowValue] && pivotData[rowValue][col];
          return cellData ? (valueMeasure === 'count' ? cellData.count : cellData.sum) : 0;
        }
      });
    });

    // Add total column only when there is a column dimension (to provide row totals)
    if (columnDimension) {
      columnDefs.push({
        headerName: 'Total',
        valueGetter: (params: { data: { [x: string]: any; }; }) => {
          const rowValue = params.data[rowDimension];
          let total = 0;
          for (const col in pivotData[rowValue]) {
            total += valueMeasure === 'count' ?
              pivotData[rowValue][col].count :
              pivotData[rowValue][col].sum;
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

  private fetchCardStatistics() {

    const data = this.data();

    const totalEvents = data.reduce((acc: number, r: any) => acc + (Number(r?.events_count) || 0), 0);
    const totalUsers = data.reduce((acc: number, r: any) => acc + (Number(r?.users_count) || 0), 0);

    this.totalEvents = totalEvents;
    this.uniqueUsers = totalUsers;

    if (!data.length) {
      this.averageDuration = '0.00 ms';
      return;
    }

    // Average of avg_duration_ms across records that have it
    const durations = data
      .map((r: any) => Number(r?.avg_duration_ms))
      .filter((v: number) => !isNaN(v));

    if (durations.length === 0) {
      this.averageDuration = '0.00 ms';
      return;
    }

    const avg = durations.reduce((a: number, b: number) => a + b, 0) / durations.length;
    this.averageDuration = avg.toFixed(2) + ' ms';
  }

}

interface Filter {
  name: string,
  code: string
}
