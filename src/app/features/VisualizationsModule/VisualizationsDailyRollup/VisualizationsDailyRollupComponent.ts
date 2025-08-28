import {Component, effect, inject, OnInit, signal, ChangeDetectionStrategy} from '@angular/core';
import {Button, ButtonDirective, ButtonIcon, ButtonLabel} from 'primeng/button';
import {FormsModule} from '@angular/forms';
import {AgChartOptions} from 'ag-charts-community';
import {AgCharts} from 'ag-charts-angular';
import {ProgressSpinner} from 'primeng/progressspinner';
import {DataService} from '../../../core/services/DataService';
import {FilterDrawerComponent} from '../../shared/components/filter-drawer';
import { FiltersService } from '../../../core/services/FiltersService';
import { applyCommonFilters } from '../../shared/utils/applyFilters';
import {PageHeaderComponent} from '../../shared/components/PageHeaderComponent/PageHeaderComponent';
import {PrimeTemplate} from 'primeng/api';
import {Select} from 'primeng/select';
import {SplitButton} from 'primeng/splitbutton';


@Component({
  selector: 'app-visualizations',
  templateUrl: './VisualizationsDailyRollupComponent.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonDirective, ButtonIcon, ButtonLabel, FormsModule, Button, AgCharts, ProgressSpinner, FilterDrawerComponent, PageHeaderComponent, PrimeTemplate, Select, SplitButton],
  providers: [],
  styleUrls: ['./VisualizationsDailyRollupComponent.scss']
})
export class VisualizationsDailyRollupComponent implements OnInit {

  private dataService = inject(DataService);
  protected filtersService = inject(FiltersService);

  public data = this.dataService.filteredDailyRollups;
  loading = this.dataService.loading;
  error = this.dataService.error;

  // Facet selections
  selectedSource = signal<string | null>(null);
  selectedPlatform = signal<string | null>(null);
  selectedCountry = signal<string | null>(null);
  selectedReleaseChannel = signal<string | null>(null);

  // Options for dropdowns derived from current data
  sourceOptions = () => uniqSorted((this.data() || []).map((r: any) => r.source).filter(Boolean));
  platformOptions = () => uniqSorted((this.data() || []).map((r: any) => r.platform).filter(Boolean));
  countryOptions = () => uniqSorted((this.data() || []).map((r: any) => r.country).filter(Boolean));
  releaseChannelOptions = () => uniqSorted((this.data() || []).map((r: any) => r.release_channel).filter(Boolean));

  // Derived filtered data applying search/query/facets in addition to date range
  public viewData = () => applyCommonFilters(this.data() || [], {
    searchText: this.filtersService.searchText(),
    query: this.filtersService.customQuery(),
    facets: {
      source: this.selectedSource(),
      platform: this.selectedPlatform(),
      country: this.selectedCountry(),
      release_channel: this.selectedReleaseChannel(),
    },
    stringify: (row: any) => [row.day, row.source, row.platform, row.country, row.app_id, row.event_group]
      .map((v: any) => String(v ?? '')).join(' ')
  });

  eventsOverTime: any;
  eventGroupDistribution: any;
  platformDistribution: any;
  deviceTierPerformance: any;
  countryDistribution: any;
  appStartPercentilesOverTime: any;

  // Chart options
  eventsOverTimeChartOptions!: AgChartOptions;
  eventsChartOptions!: AgChartOptions;
  platformChartOptions!: AgChartOptions;
  deviceTierChartOptions!: AgChartOptions;
  countryChartOptions!: AgChartOptions;
  appStartPercentilesChartOptions!: AgChartOptions;

  filters!: Filter[];

  savedConfigNames = () => (this.filtersService.savedConfigs() || []).map(c => c.name);

  visible = signal(false);

  // Charts
  chartLoaded: any = false;

  constructor() {
    effect(() => {
      let eventsOverTime = this.getEventsOverTime();
      let eventGroupDistribution = this.getEventGroupDistribution();
      let platformDistribution = this.getPlatformDistribution();
      let deviceTierPerformance = this.getAppStartByDeviceTier();
      let countryDistribution = this.getCountryDistribution();
      let appStartPercentilesOverTime = this.getAppStartPercentilesOverTime();

      this.chartLoaded = true;

      // Chart 1: Events Over Time (Daily Total Events)
      this.eventsOverTimeChartOptions = {
        title: {
          text: 'Events Over Time (Daily Totals)',
        },
        data: [...eventsOverTime],
        series: [
          {
            type: 'line',
            xKey: 'day',
            yKey: 'events_count',
            yName: 'Events',
          },
        ],
        axes: [
          {
            type: 'category', position: 'bottom', title: {text: 'Date'},
          },
          {
            type: 'number', position: 'left', title: {text: 'Events'},
          },
        ],
      };

      // Chart 2: Event Group Distribution (by Events)
      this.eventsChartOptions = {
        title: {
          text: 'Event Group Distribution',
        },
        data: [...eventGroupDistribution],
        series: [
          {
            type: 'pie', angleKey: 'events_count', legendItemKey: 'event_group', calloutLabelKey: 'event_group',
          },
        ],
      };

      // Chart 3: Platform Distribution (by Events)
      this.platformChartOptions = {
        title: {
          text: 'Events by Platform',
        },
        data: [...platformDistribution],
        series: [
          {
            type: 'bar',
            xKey: 'platform',
            yKey: 'events_count',
          },
        ],
        axes: [
          {type: 'category', position: 'bottom'},
          {type: 'number', position: 'left', title: {text: 'Events'}},
        ],
      };

      // Chart 4: App Start Performance by Device Tier (avg duration)
      this.deviceTierChartOptions = {
        title: {
          text: 'App Start Performance by Device Tier',
        },
        data: [...deviceTierPerformance],
        series: [
          {
            type: 'bar',
            xKey: 'device_tier',
            yKey: 'avg_duration_ms',
            yName: 'Average Duration (ms)',
          },
        ],
        axes: [
          {type: 'category', position: 'bottom', title: {text: 'Device Tier'}},
          {type: 'number', position: 'left', title: {text: 'Average Duration (ms)'}},
        ],
      };

      // Chart 5: Events by Country
      this.countryChartOptions = {
        title: {
          text: 'Events by Country',
        },
        data: [...countryDistribution],
        series: [
          {
            type: 'pie',
            angleKey: 'events_count',
            legendItemKey: 'country',
            calloutLabelKey: 'country',
          },
        ],
      };

      // Chart 6: App Start Percentiles Over Time (P50/P90/P99)
      this.appStartPercentilesChartOptions = {
        title: {
          text: 'App Start Percentiles Over Time',
        },
        data: [...appStartPercentilesOverTime],
        series: [
          {type: 'line', xKey: 'day', yKey: 'p50_duration_ms', yName: 'P50 (ms)'},
          {type: 'line', xKey: 'day', yKey: 'p90_duration_ms', yName: 'P90 (ms)'},
          {type: 'line', xKey: 'day', yKey: 'p99_duration_ms', yName: 'P99 (ms)'},
        ],
        axes: [
          {type: 'category', position: 'bottom', title: {text: 'Date'}},
          {type: 'number', position: 'left', title: {text: 'Duration (ms)'}},
        ],
      };
    });


  }

  // Sum events_count per day
  getEventsOverTime() {
    const byDay: Record<string, number> = {};
    (this.viewData() || []).forEach((item: any) => {
      byDay[item.day] = (byDay[item.day] || 0) + (item.events_count || 0);
    });
    return Object.keys(byDay)
      .sort()
      .map(day => ({ day, events_count: byDay[day] }));
  }

  // Distribution of events_count by event_group
  getEventGroupDistribution() {
    const groups: Record<string, number> = {};
    (this.viewData() || []).forEach((item: any) => {
      const key = item.event_group || 'unknown';
      groups[key] = (groups[key] || 0) + (item.events_count || 0);
    });
    return Object.keys(groups).map(event_group => ({ event_group, events_count: groups[event_group] }));
  }

  // Sum events_count by platform
  getPlatformDistribution() {
    const platforms: Record<string, number> = {};
    (this.viewData() || []).forEach((item: any) => {
      const key = item.platform || 'unknown';
      platforms[key] = (platforms[key] || 0) + (item.events_count || 0);
    });
    return Object.keys(platforms).map(platform => ({ platform, events_count: platforms[platform] }));
  }

  // Weighted average app_start avg_duration_ms by device_tier
  getAppStartByDeviceTier() {
    const sumWeighted: Record<string, number> = {};
    const sumCounts: Record<string, number> = {};
    (this.viewData() || [])
      .filter((item: any) => item.source === 'performance' && item.event_group === 'performance:app_start' && typeof item.avg_duration_ms === 'number')
      .forEach((item: any) => {
        const tier = item.device_tier || 'unknown';
        const count = item.events_count || 0;
        sumWeighted[tier] = (sumWeighted[tier] || 0) + item.avg_duration_ms * count;
        sumCounts[tier] = (sumCounts[tier] || 0) + count;
      });
    return Object.keys(sumCounts).map(device_tier => ({
      device_tier,
      avg_duration_ms: Math.round(sumWeighted[device_tier] / (sumCounts[device_tier] || 1))
    }));
  }

  // Sum events_count by country
  getCountryDistribution() {
    const countries: Record<string, number> = {};
    (this.viewData() || []).forEach((item: any) => {
      const key = item.country || 'unknown';
      countries[key] = (countries[key] || 0) + (item.events_count || 0);
    });
    return Object.keys(countries).map(country => ({ country, events_count: countries[country] }));
  }

  // Weighted average percentiles per day for app_start
  getAppStartPercentilesOverTime() {
    const byDay: Record<string, { w: number; p50: number; p90: number; p99: number }> = {};
    (this.viewData() || [])
      .filter((item: any) => item.source === 'performance' && item.event_group === 'performance:app_start')
      .forEach((item: any) => {
        const w = item.events_count || 0;
        const d = item.day;
        if (!byDay[d]) byDay[d] = { w: 0, p50: 0, p90: 0, p99: 0 };
        byDay[d].w += w;
        if (typeof item.p50_duration_ms === 'number') byDay[d].p50 += item.p50_duration_ms * w;
        if (typeof item.p90_duration_ms === 'number') byDay[d].p90 += item.p90_duration_ms * w;
        if (typeof item.p99_duration_ms === 'number') byDay[d].p99 += item.p99_duration_ms * w;
      });

    return Object.keys(byDay)
      .sort()
      .map(day => ({
        day,
        p50_duration_ms: Math.round(byDay[day].p50 / (byDay[day].w || 1)),
        p90_duration_ms: Math.round(byDay[day].p90 / (byDay[day].w || 1)),
        p99_duration_ms: Math.round(byDay[day].p99 / (byDay[day].w || 1)),
      }));
  }


  async ngOnInit() {

    this.filters = [{name: 'Today\'s records', code: 'NY'}, {
      name: 'This weeks\'s records', code: 'RM'
    }, {name: 'This month\'s records', code: 'LDN'}, {name: 'This year\'s records', code: 'IST'}];
  }

  toggleFilterVisibility() {
    this.visible.update(v => !v);
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

  printScreen() {
    window.print();
  }

  protected readonly print = print;
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

