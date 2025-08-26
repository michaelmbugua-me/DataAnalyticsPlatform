import {Component, inject, OnInit, Signal, signal} from '@angular/core';
import {AgGridAngular} from 'ag-grid-angular';
import {ColDef, GridOptions, GridReadyEvent, ValueFormatterParams, CellClassParams} from 'ag-grid-community';
import {Button, ButtonDirective, ButtonIcon, ButtonLabel} from 'primeng/button';
import {FormsModule} from '@angular/forms';
import {DataService} from '../../../core/services/DataService';
import {FilterDrawerComponent} from '../../shared/components/FilterDrawerComponent/FilterDrawerComponent';
import {DailyRollup, EventSource, ReleaseChannel} from '../../../core/models/DataModels';
import { getSourceCellStyle, getReleaseChannelStyle, getDurationCellStyle } from '../../shared/utils/gridCellStyles';


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

  public data: Signal<DailyRollup[]> = this.dataService.filteredDailyRollups;
  error: Signal<string | null> = this.dataService.error;

  filters!: Filter[];


  visible = signal(false);

  columnDefs: ColDef<DailyRollup>[] = [
    { field: 'day', headerName: 'Day', filter: 'agDateColumnFilter', minWidth: 180, },
    { field: 'source', headerName: 'Source', filter: 'agTextColumnFilter', minWidth: 180,
      cellStyle: (params: CellClassParams) => getSourceCellStyle(params.value as EventSource)
    },
    { field: 'platform', headerName: 'Platform', filter: 'agTextColumnFilter',minWidth: 180, },
    { field: 'app_id', headerName: 'App ID', filter: 'agTextColumnFilter',minWidth: 180, },
    { field: 'app_version', headerName: 'App Version', filter: 'agTextColumnFilter',minWidth: 180, },
    { field: 'release_channel', headerName: 'Release Channel', filter: 'agTextColumnFilter',minWidth: 180,
      cellStyle: (params: CellClassParams) => getReleaseChannelStyle(params.value as ReleaseChannel)
    },
    { field: 'country', headerName: 'Country', filter: 'agTextColumnFilter',minWidth: 180, },
    { field: 'device_tier', headerName: 'Device Tier', filter: 'agTextColumnFilter',minWidth: 180, },
    { field: 'event_group', headerName: 'Event Group', filter: 'agTextColumnFilter',minWidth: 180, },
    {
      field: 'events_count',
      headerName: 'Events Count',
      filter: 'agNumberColumnFilter',
      type: 'numericColumn', minWidth: 180,
    },
    {
      field: 'users_count',
      headerName: 'Users Count',
      filter: 'agNumberColumnFilter',
      type: 'numericColumn',minWidth: 180,
    },
    {
      field: 'sessions_count',
      headerName: 'Sessions Count',
      filter: 'agNumberColumnFilter',
      type: 'numericColumn', minWidth: 180,
    },
    {
      field: 'revenue_usd',
      headerName: 'Revenue USD',
      filter: 'agNumberColumnFilter',
      type: 'numericColumn',minWidth: 180,
      valueFormatter: (params: ValueFormatterParams<DailyRollup, number>) => params.value ? `$${params.value.toFixed(2)}` : '$0.00'
    },
    {
      field: 'purchase_count',
      headerName: 'Purchase Count',
      filter: 'agNumberColumnFilter',
      type: 'numericColumn', minWidth: 180,
    },
    {
      field: 'avg_duration_ms',
      headerName: 'Avg Duration (ms)',
      filter: 'agNumberColumnFilter',
      type: 'numericColumn', minWidth: 180,
      valueFormatter: (params: ValueFormatterParams<DailyRollup, number | undefined>) => params.value ? `${params.value}ms` : '',
      cellStyle: (params: CellClassParams) => getDurationCellStyle(params.value as number)
    },
    {
      field: 'p50_duration_ms',
      headerName: 'P50 Duration (ms)',
      filter: 'agNumberColumnFilter',
      type: 'numericColumn',
      minWidth: 180,
      valueFormatter: (params: ValueFormatterParams<DailyRollup, number | undefined>) => params.value ? `${params.value}ms` : '',
      cellStyle: (params: CellClassParams) => getDurationCellStyle(params.value as number)
    },
    {
      field: 'p90_duration_ms',
      headerName: 'P90 Duration (ms)',
      filter: 'agNumberColumnFilter',
      type: 'numericColumn',
      minWidth: 180,
      valueFormatter: (params: ValueFormatterParams<DailyRollup, number | undefined>) => params.value ? `${params.value}ms` : '',
      cellStyle: (params: CellClassParams) => getDurationCellStyle(params.value as number)
    },
    {
      field: 'p99_duration_ms',
      headerName: 'P99 Duration (ms)',
      filter: 'agNumberColumnFilter',
      type: 'numericColumn',
      minWidth: 180,
      valueFormatter: (params: ValueFormatterParams<DailyRollup, number | undefined>) => params.value ? `${params.value}ms` : '',
      cellStyle: (params: CellClassParams) => getDurationCellStyle(params.value as number)
    }
  ];

  public defaultColDef: ColDef<DailyRollup> = {};

  // Grid Options
  public gridOptions: GridOptions<DailyRollup> = {
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

  onGridReady(params: GridReadyEvent<DailyRollup>) {
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
