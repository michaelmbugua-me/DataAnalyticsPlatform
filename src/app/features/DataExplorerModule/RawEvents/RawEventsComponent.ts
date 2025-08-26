import {Component, inject, OnInit, signal, computed, Signal} from '@angular/core';
import {AgGridAngular} from 'ag-grid-angular';
import {ColDef, GridOptions, GridReadyEvent, ValueFormatterParams, CellClassParams} from 'ag-grid-community';
import {Button, ButtonDirective, ButtonIcon, ButtonLabel} from 'primeng/button';
import {FormsModule} from '@angular/forms';
import {DataService} from '../../../core/services/DataService';
import {FilterDrawerComponent} from '../../shared/components/filter-drawer';
import {
  RawEvent,
  AnalyticsEvent,
  PerformanceEvent,
  CrashEvent,
  EventSource,
  Platform,
  Country,
  ReleaseChannel
} from '../../../core/models/DataModels';
import { getSourceCellStyle, getReleaseChannelStyle, getDurationCellStyle } from '../../shared/utils/gridCellStyles';

@Component({
  selector: 'app-raw-events-component',
  templateUrl: './RawEventsComponent.html',
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
  styleUrls: ['./RawEventsComponent.scss']
})
export class RawEventsComponent implements OnInit {

  private dataService = inject(DataService);

  // Type-safe data with proper typing
  public data: Signal<RawEvent[]> = this.dataService.filteredRawData;
  error: Signal<string | null> = this.dataService.error;

  filters!: Filter[];
  visible = signal(false);

  // Computed signals for different event types (optional - for additional functionality)
  analyticsEvents = computed(() =>
    this.data()?.filter((event): event is AnalyticsEvent => event.source === 'analytics') ?? []
  );

  performanceEvents = computed(() =>
    this.data()?.filter((event): event is PerformanceEvent => event.source === 'performance') ?? []
  );

  crashEvents = computed(() =>
    this.data()?.filter((event): event is CrashEvent => event.source === 'crash') ?? []
  );

  // Enhanced column definitions with type-aware formatters
  columnDefs: ColDef<RawEvent>[] = [
    {
      field: 'id',
      headerName: 'ID',
      filter: 'agTextColumnFilter',
      minWidth: 200
    },
    {
      field: 'timestamp',
      headerName: 'Timestamp',
      filter: 'agDateColumnFilter',
      minWidth: 180,
      valueFormatter: (params: any) =>
        new Date(params.value).toLocaleString()
    },
    {
      field: 'day',
      headerName: 'Day',
      filter: 'agDateColumnFilter',
      minWidth: 120
    },
    {
      field: 'hour',
      headerName: 'Hour',
      filter: 'agNumberColumnFilter',
      minWidth: 80
    },
    {
      field: 'source',
      headerName: 'Source',
      filter: 'agTextColumnFilter',
      minWidth: 160,
      cellStyle: (params: CellClassParams) => getSourceCellStyle(params.value as EventSource)
    },
    {
      field: 'event_name',
      headerName: 'Event Name',
      filter: 'agTextColumnFilter',
      minWidth: 150
    },
    {
      field: 'platform',
      headerName: 'Platform',
      filter: 'agTextColumnFilter',
      minWidth: 100,
      valueFormatter: (params: any) => this.getPlatformIcon(params.value)
    },
    {
      field: 'app_id',
      headerName: 'App ID',
      filter: 'agTextColumnFilter',
      minWidth: 140
    },
    {
      field: 'country',
      headerName: 'Country',
      filter: 'agTextColumnFilter',
      minWidth: 100
    },
    {
      field: 'release_channel',
      headerName: 'Release',
      filter: 'agTextColumnFilter',
      minWidth: 100,
      cellStyle: (params: CellClassParams) => getReleaseChannelStyle(params.value as ReleaseChannel)
    },
    {
      field: 'session_id',
      headerName: 'Session ID',
      filter: 'agTextColumnFilter',
      minWidth: 160
    },
    {
      field: 'user_pseudo_id',
      headerName: 'User ID',
      filter: 'agTextColumnFilter',
      minWidth: 160
    },
    // Conditional columns based on event type
    {
      field: 'analytics_event',
      headerName: 'Analytics Event',
      filter: 'agTextColumnFilter',
      minWidth: 150,
      hide: false // Show/hide based on filters
    },
    {
      field: 'duration_ms',
      headerName: 'Duration (ms)',
      filter: 'agNumberColumnFilter',
      minWidth: 160,
      valueFormatter: (params: ValueFormatterParams<RawEvent, number | undefined>) =>
        params.value ? `${params.value}ms` : '-',
      cellStyle: (params: CellClassParams) => getDurationCellStyle(params.value as number)
    },
    {
      field: 'status_code',
      headerName: 'Status',
      filter: 'agNumberColumnFilter',
      minWidth: 100,
      cellStyle: (params: CellClassParams) => this.getStatusCodeStyle(params.value as number)
    },
    {
      field: 'crash_type',
      headerName: 'Crash Type',
      filter: 'agTextColumnFilter',
      minWidth: 160,
      cellStyle: { color: '#dc3545', fontWeight: 'bold' }
    }
  ];

  public defaultColDef: ColDef<RawEvent> = {
    sortable: true,
    resizable: true,
    filter: true
  };

  public gridOptions: GridOptions<RawEvent> = {
    rowModelType: 'clientSide',
    pagination: true,
    paginationPageSize: 100,
    enableCellTextSelection: true,
    ensureDomOrder: true,
    animateRows: true,
    sideBar: {
      toolPanels: [
        {
          id: 'columns',
          labelDefault: 'Columns',
          labelKey: 'columns',
          iconKey: 'columns',
          toolPanel: 'agColumnsToolPanel'
        },
        {
          id: 'filters',
          labelDefault: 'Filters',
          labelKey: 'filters',
          iconKey: 'filter',
          toolPanel: 'agFiltersToolPanel'
        }
      ]
    },
    suppressMenuHide: true,
    domLayout: 'normal'
  };

  async ngOnInit() {
    this.filters = [
      {name: 'Today\'s records', code: 'TODAY'},
      {name: 'This week\'s records', code: 'WEEK'},
      {name: 'This month\'s records', code: 'MONTH'},
      {name: 'This year\'s records', code: 'YEAR'}
    ];
  }

  onGridReady(params: GridReadyEvent<RawEvent>) {
    console.log('Grid is ready');
    params.api.sizeColumnsToFit();

    // Apply initial column visibility based on data
    this.updateColumnVisibility(params);
  }

  toggleFilterVisibility() {
    this.visible.update(v => !v);
  }

  // Type-safe helper methods using the model types
  private getPlatformIcon(platform: Platform): string {
    const icons = {
      ios: 'iOS',
      android: 'Android',
      web: 'Web'
    };
    return icons[platform] || platform;
  }

  private getStatusCodeStyle(statusCode: number): Record<string, string> {
    if (!statusCode) return {};

    if (statusCode >= 500) return { backgroundColor: '#d32f2f', color: 'white' };
    if (statusCode >= 400) return { backgroundColor: '#ff9800', color: 'white' };
    if (statusCode >= 200 && statusCode < 300) return { backgroundColor: '#4caf50', color: 'white' };
    return {};
  }

  private updateColumnVisibility(params: GridReadyEvent<RawEvent>) {
    const data = this.data();
    if (!data || data.length === 0) return;

    const hasAnalytics = data.some(event => event.source === 'analytics');
    const hasPerformance = data.some(event => event.source === 'performance');
    const hasCrashes = data.some(event => event.source === 'crash');

    params.api.applyColumnState({
      state: [
        { colId: 'analytics_event', hide: !hasAnalytics },
        { colId: 'duration_ms', hide: !hasPerformance },
        { colId: 'status_code', hide: !hasPerformance },
        { colId: 'crash_type', hide: !hasCrashes }
      ]
    });
  }

  // Type-safe filter methods
  filterBySource(source: EventSource) {
    // Implementation for filtering by event source
    console.log(`Filtering by source: ${source}`);
  }

  filterByPlatform(platform: Platform) {
    // Implementation for filtering by platform
    console.log(`Filtering by platform: ${platform}`);
  }

  filterByCountry(country: Country) {
    // Implementation for filtering by country
    console.log(`Filtering by country: ${country}`);
  }

  // Export functionality with proper typing
  exportAnalyticsEvents() {
    const analyticsData = this.analyticsEvents();
    console.log('Exporting analytics events:', analyticsData.length);
    // Implementation for export
  }

  exportPerformanceEvents() {
    const performanceData = this.performanceEvents();
    console.log('Exporting performance events:', performanceData.length);
    // Implementation for export
  }

  exportCrashEvents() {
    const crashData = this.crashEvents();
    console.log('Exporting crash events:', crashData.length);
    // Implementation for export
  }
}

interface Filter {
  name: string;
  code: string;
}
