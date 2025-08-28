import {Component, inject, OnInit, Signal, signal, computed, ChangeDetectionStrategy} from '@angular/core';
import {AgGridAngular} from 'ag-grid-angular';
import {ColDef, GridOptions, GridReadyEvent, ValueFormatterParams, CellClassParams} from 'ag-grid-community';
import {ButtonDirective, ButtonIcon, ButtonLabel} from 'primeng/button';
import {FormsModule} from '@angular/forms';
import {DataService} from '../../../core/services/DataService';
import {FilterDrawerComponent} from '../../shared/components/filter-drawer';
import {DailyRollup, EventSource, ReleaseChannel} from '../../../core/models/DataModels';
import { getSourceCellStyle, getReleaseChannelStyle, getDurationCellStyle } from '../../shared/utils/gridCellStyles';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import {DataExportationService} from '../../../core/services/DataExportationService';
import { FiltersService } from '../../../core/services/FiltersService';
import { evaluateQuery } from '../../../core/utils/query';
import {SplitButton} from 'primeng/splitbutton';
import {MenuItem, PrimeTemplate} from 'primeng/api';
import {Select} from 'primeng/select';
import { PageHeaderComponent } from '../../shared/components/PageHeaderComponent/PageHeaderComponent';


ModuleRegistry.registerModules([AllCommunityModule]);


@Component({
  selector: 'app-daily-rollups-component',
  templateUrl: './DailyRollupsComponent.html',
  imports: [
    AgGridAngular,
    ButtonDirective,
    ButtonIcon,
    ButtonLabel,
    FormsModule,
    FilterDrawerComponent,
    SplitButton,
    PrimeTemplate,
    Select,
    PageHeaderComponent
  ],
  providers: [],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./DailyRollupsComponent.scss'],
})
export class DailyRollupsComponent implements OnInit {

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

  private dataService = inject(DataService);
  private dataExportationService = inject(DataExportationService);
  filtersService = inject(FiltersService);

  public data: Signal<DailyRollup[]> = this.dataService.filteredDailyRollups;

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

  // Derived filtered data based on search + custom query + facet dropdowns
  public viewData: Signal<DailyRollup[]> = computed(() => {
    const base = this.data();
    const search = (this.filtersService.searchText() || '').toLowerCase();
    const query = this.filtersService.customQuery() || '';

    const src = this.selectedSource();
    const plat = this.selectedPlatform();
    const ctry = this.selectedCountry();
    const rel = this.selectedReleaseChannel();

    const bySearch = (row: DailyRollup) => {
      if (!search) return true;
      const hay = [row.day, row.source, row.platform, row.country, row.app_id, row.event_group]
        .map(v => String(v ?? '')).join(' ').toLowerCase();
      return hay.includes(search);
    };

    const byQuery = (row: DailyRollup) => {
      if (!query.trim()) return true;
      try { return evaluateQuery(row as any, query); } catch { return false; }
    };

    const byFacets = (row: DailyRollup) =>
      (!src || row.source === src) &&
      (!plat || row.platform === plat) &&
      (!ctry || row.country === ctry) &&
      (!rel || row.release_channel === rel);

    return base.filter(r => bySearch(r) && byQuery(r) && byFacets(r));
  });
  error: Signal<string | null> = this.dataService.error;

  filters!: Filter[];

  savedConfigNames = computed(() => (this.filtersService.savedConfigs() || []).map(c => c.name));


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
    suppressMenuHide: true,
    domLayout: 'normal'
  };
  private columns: any;
  items: MenuItem[] | undefined;

  async ngOnInit() {
    const sel = this.filtersService.selectedConfigName();
    if (sel) this.applySelectedConfig(sel);

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
      this.dataExportationService.exportToPdf(cols, matrix as string[][], 'Daily_rollups.pdf');
    } else if (type === 'xlsx') {
      this.dataExportationService.exportDataXlsx(jsonRows, 'Daily_rollups');
    } else if (type === 'csv') {
      this.dataExportationService.exportToCsv(jsonRows as any, 'Daily_rollups');
    }
  }

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
  name: string,
  code: string
}
