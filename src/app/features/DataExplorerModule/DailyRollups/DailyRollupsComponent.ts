import {Component, inject, OnInit, signal} from '@angular/core';
import {AgGridAngular} from 'ag-grid-angular';
import {ColDef, GridOptions, GridReadyEvent} from 'ag-grid-community';
import {Button, ButtonDirective, ButtonIcon, ButtonLabel} from 'primeng/button';
import {FormsModule} from '@angular/forms';
import {DataService} from '../../../core/services/DataService';
import {FilterDrawerComponent} from '../../shared/FilterDrawerComponent/FilterDrawerComponent';


@Component({
  selector: 'app-daily-rollups-component',
  templateUrl: './DailyRollupsComponent.html',
  imports: [
    AgGridAngular,
    ButtonDirective,
    ButtonIcon,
    ButtonLabel,
    FormsModule,
    Button,
    FilterDrawerComponent
  ],
  providers: [],
  styleUrls: ['./DailyRollupsComponent.scss']
})
export class DailyRollupsComponent implements OnInit {

  private dataService = inject(DataService);

  public data = this.dataService.filteredDailyRollups;
  error = this.dataService.error;

  filters!: Filter[];


  visible = signal(false);

  columnDefs: ColDef[] = [
    { field: 'day', headerName: 'Day', filter: 'agDateColumnFilter', minWidth: 120,
      maxWidth: 150 },
    { field: 'source', headerName: 'Source', filter: 'agTextColumnFilter', minWidth: 120,
      maxWidth: 150 },
    { field: 'platform', headerName: 'Platform', filter: 'agTextColumnFilter',minWidth: 120,
      maxWidth: 150 },
    { field: 'app_id', headerName: 'App ID', filter: 'agTextColumnFilter',minWidth: 120,
      maxWidth: 150 },
    { field: 'app_version', headerName: 'App Version', filter: 'agTextColumnFilter',minWidth: 120,
      maxWidth: 150 },
    { field: 'release_channel', headerName: 'Release Channel', filter: 'agTextColumnFilter',minWidth: 120,
      maxWidth: 150 },
    { field: 'country', headerName: 'Country', filter: 'agTextColumnFilter',minWidth: 120,
      maxWidth: 150 },
    { field: 'device_tier', headerName: 'Device Tier', filter: 'agTextColumnFilter',minWidth: 120,
      maxWidth: 150 },
    { field: 'event_group', headerName: 'Event Group', filter: 'agTextColumnFilter',minWidth: 120,
      maxWidth: 150 },
    {
      field: 'events_count',
      headerName: 'Events Count',
      filter: 'agNumberColumnFilter',
      type: 'numericColumn', minWidth: 120,
      maxWidth: 150
    },
    {
      field: 'users_count',
      headerName: 'Users Count',
      filter: 'agNumberColumnFilter',
      type: 'numericColumn',minWidth: 120,
      maxWidth: 150
    },
    {
      field: 'sessions_count',
      headerName: 'Sessions Count',
      filter: 'agNumberColumnFilter',
      type: 'numericColumn', minWidth: 120,
      maxWidth: 150
    },
    {
      field: 'revenue_usd',
      headerName: 'Revenue USD',
      filter: 'agNumberColumnFilter',
      type: 'numericColumn',minWidth: 120,
      valueFormatter: params => params.value ? `$${params.value.toFixed(2)}` : '$0.00'
    },
    {
      field: 'purchase_count',
      headerName: 'Purchase Count',
      filter: 'agNumberColumnFilter',
      type: 'numericColumn', minWidth: 120,
      maxWidth: 150
    },
    {
      field: 'avg_duration_ms',
      headerName: 'Avg Duration (ms)',
      filter: 'agNumberColumnFilter',
      type: 'numericColumn', minWidth: 120,
      valueFormatter: params => params.value ? `${params.value}ms` : ''
    },
    {
      field: 'p50_duration_ms',
      headerName: 'P50 Duration (ms)',
      filter: 'agNumberColumnFilter',
      type: 'numericColumn',
      minWidth: 120,
      valueFormatter: params => params.value ? `${params.value}ms` : ''
    },
    {
      field: 'p90_duration_ms',
      headerName: 'P90 Duration (ms)',
      filter: 'agNumberColumnFilter',
      type: 'numericColumn',
      minWidth: 120,
      valueFormatter: params => params.value ? `${params.value}ms` : ''
    },
    {
      field: 'p99_duration_ms',
      headerName: 'P99 Duration (ms)',
      filter: 'agNumberColumnFilter',
      type: 'numericColumn',
      minWidth: 120,
      valueFormatter: params => params.value ? `${params.value}ms` : ''
    }
  ];

  public defaultColDef: ColDef = {};

  // Grid Options
  public gridOptions: GridOptions = {
    rowModelType: 'clientSide',
    pagination: true,
    enableCellTextSelection: true,
    ensureDomOrder: true,
    animateRows: true,
    sideBar: false,
    suppressMenuHide: true,
    domLayout: 'normal'
  };

  async ngOnInit() {

    this.filters = [
      {name: 'Today\'s records', code: 'NY'},
      {name: 'This weeks\'s records', code: 'RM'},
      {name: 'This month\'s records', code: 'LDN'},
      {name: 'This year\'s records', code: 'IST'}
    ];
  }

  onGridReady(params: GridReadyEvent) {
    console.log('Grid is ready');
    params.api.sizeColumnsToFit();

  }

  toggleFilterVisibility() {
    this.visible.update(v => !v);
  }
}

interface Filter {
  name: string,
  code: string
}
