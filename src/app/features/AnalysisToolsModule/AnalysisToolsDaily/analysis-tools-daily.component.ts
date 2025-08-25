import {Component, inject, OnInit, signal} from '@angular/core';
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

  public data = this.dataService.data;
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
      measure: ['count', Validators.required]
    });

    this.pivotTableForm = fb.group({
      rowDimension: ['platform', Validators.required],
      columnDimension: [''],
      valueMeasure: ['count', Validators.required]
    });
  }

  async ngOnInit() {

    this.filters = [
      {name: 'Today\'s records', code: 'NY'},
      {name: 'This weeks\'s records', code: 'RM'},
      {name: 'This month\'s records', code: 'LDN'},
      {name: 'This year\'s records', code: 'IST'}
    ];

    this.fetchCardStatistics()

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

    this.data().forEach((item: any) => {
      const rowValue = item[rowDimension] || 'Unknown';
      const colValue = columnDimension ? (item[columnDimension] || 'Unknown') : 'Total';

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
      pivotData[rowValue][colValue].sum += item[valueMeasure] || 0;
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

    // Add total column
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
