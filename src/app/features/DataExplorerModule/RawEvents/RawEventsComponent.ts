import {Component, inject, OnInit, signal, computed, Signal, ChangeDetectionStrategy} from '@angular/core';
import {AgGridAngular} from 'ag-grid-angular';
import {ColDef, GridOptions, GridReadyEvent, ValueFormatterParams, CellClassParams} from 'ag-grid-community';
import {ButtonDirective, ButtonIcon, ButtonLabel} from 'primeng/button';
import {Select} from 'primeng/select';
import {FormsModule} from '@angular/forms';
import {DataService} from '../../../core/services/DataService';
import { FilterDrawerComponent } from '../../shared/components/data-explorer/FilterDrawerComponent/FilterDrawerComponent';
import {
  RawEvent,
  EventSource,
  Platform,
  ReleaseChannel
} from '../../../core/models/DataModels';
import { getSourceCellStyle, getReleaseChannelStyle, getDurationCellStyle } from '../../shared/utils/gridCellStyles';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import {DataExportationService} from '../../../core/services/DataExportationService';
import { FiltersService } from '../../../core/services/FiltersService';
import { evaluateQuery } from '../../../core/utils/query';
import { PageHeaderComponent } from '../../shared/components/shared-globally/PageHeaderComponent/PageHeaderComponent';
import {MenuItem, PrimeTemplate} from 'primeng/api';
import {SplitButton} from 'primeng/splitbutton';

// Register AG Grid modules lazily for this feature chunk
ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'app-raw-events-component',
  templateUrl: './RawEventsComponent.html',
  imports: [
    AgGridAngular,
    ButtonDirective,
    ButtonIcon,
    ButtonLabel,
    FormsModule,
    FilterDrawerComponent,
    Select,
    PageHeaderComponent,
    PrimeTemplate,
    SplitButton
  ],
  providers: [],
  styleUrls: ['./RawEventsComponent.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RawEventsComponent implements OnInit {

  constructor() {

    this.items = [
      {
        label: 'Export as PDF',
        command: () => {
          this.exportRecords('pdf');
        }
      },
      {
        label: 'Export as Excel',
        command: () => {
          this.exportRecords('xlsx');
        }
      },
      {
        label: 'Export as CSV',
        command: () => {
          this.exportRecords('csv');
        }
      }
    ]
  }

  filtersService = inject(FiltersService);

  // Facet selection signals for easier user interaction
  selectedSource = signal<string | null>(null);
  selectedPlatform = signal<string | null>(null);
  selectedCountry = signal<string | null>(null);
  selectedReleaseChannel = signal<string | null>(null);

  // Options for dropdowns derived from current data
  sourceOptions = computed(() => uniqSorted(this.data().map(r => r.source).filter(Boolean)));
  platformOptions = computed(() => uniqSorted(this.data().map(r => r.platform).filter(Boolean)));
  countryOptions = computed(() => uniqSorted(this.data().map(r => r.country).filter(Boolean)));
  releaseChannelOptions = computed(() => uniqSorted(this.data().map(r => r.release_channel).filter(Boolean)));

  // Saved config names
  savedConfigNames = computed(() => (this.filtersService.savedConfigs() || []).map(c => c.name));

  public viewData: Signal<RawEvent[]> = computed(() => {
    const base = this.data();
    const search = (this.filtersService.searchText() || '').toLowerCase();
    const query = this.filtersService.customQuery() || '';

    const src = this.selectedSource();
    const plat = this.selectedPlatform();
    const ctry = this.selectedCountry();
    const rel = this.selectedReleaseChannel();

    const bySearch = (row: RawEvent) => {
      if (!search) return true;
      const hay = [row.id, row.event_name, row.platform, row.country, row.app_id, row.source, row.release_channel]
        .map(v => String(v ?? '')).join(' ').toLowerCase();
      return hay.includes(search);
    };

    const byQuery = (row: RawEvent) => {
      if (!query.trim()) return true;
      try { return evaluateQuery(row as any, query); } catch { return false; }
    };

    const byFacets = (row: RawEvent) =>
      (!src || row.source === src) &&
      (!plat || row.platform === plat) &&
      (!ctry || row.country === ctry) &&
      (!rel || row.release_channel === rel);

    return base.filter(r => bySearch(r) && byQuery(r) && byFacets(r));
  });

  private dataService = inject(DataService);
  private dataExportationService = inject(DataExportationService);

  public data: Signal<RawEvent[]> = this.dataService.filteredRawData;
  error: Signal<string | null> = this.dataService.error;
  visible = signal(false);

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
    suppressMenuHide: true,
    domLayout: 'normal'
  };

  async ngOnInit() {
    const sel = this.filtersService.selectedConfigName();
    if (sel) this.applySelectedConfig(sel);
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

  exportRecords(type: 'pdf' | 'xlsx' | 'csv' = 'pdf') {
    // Build column headers and row data from current grid data
    let cols: string[] = this.columnDefs.map((item: any) => {
      if(item['headerName'] && String(item['headerName']).toLowerCase() !== 'actions'){
        return String(item['field'] ?? '').toUpperCase();
      } else {
        return ''
      }
    });

    cols = cols.filter(item => item !== '' && item !== undefined);

    const view = this.viewData();
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
          if(colKey === key.toUpperCase()){
            temp.push(row[key]);
            jsonRow[key] = row[key];
          }
        })
      })
      matrix.push(temp);
      jsonRows.push(jsonRow);
    })

    if (type === 'pdf') {
      this.dataExportationService.exportToPdf(cols, matrix as string[][], 'Raw_Events.pdf');
    } else if (type === 'xlsx') {
      this.dataExportationService.exportDataXlsx(jsonRows, 'Raw_Events');
    } else if (type === 'csv') {
      this.dataExportationService.exportToCsv(jsonRows as any, 'Raw_Events');
    }
  }

  // Export functionality with proper typing
  items: MenuItem[] | undefined;


  saveCurrentConfig() {
    const name = prompt('Save current filters as (name):');
    if (!name) return;
    this.filtersService.saveConfig(name, this.dataService.dateRange());
  }

  applySelectedConfig(name: string) {
    const cfg = this.filtersService.loadConfig(name);
    if (cfg?.dateRange) {
      try {
        const from = new Date(cfg.dateRange.from);
        const to = new Date(cfg.dateRange.to);
        if (!isNaN(from.getTime()) && !isNaN(to.getTime())) this.dataService.setDateRange({ from, to });
      } catch {}
    }
  }

  clearAllFilters() {
    this.filtersService.searchText.set('');
    this.filtersService.customQuery.set('');
    this.selectedSource.set(null);
    this.selectedPlatform.set(null);
    this.selectedCountry.set(null);
    this.selectedReleaseChannel.set(null);
    this.filtersService.selectedConfigName.set(null);
  }

  resetDateRangeToThisMonth() {
    this.dataService.resetToThisMonth();
  }
}

function uniqSorted(arr: (string | null | undefined)[]): string[] {
  const set = new Set<string>();
  for (const v of arr) { if (v != null) set.add(String(v)); }
  return Array.from(set).sort((a,b) => a.localeCompare(b));
}

interface Filter {
  name: string;
  code: string;
}
