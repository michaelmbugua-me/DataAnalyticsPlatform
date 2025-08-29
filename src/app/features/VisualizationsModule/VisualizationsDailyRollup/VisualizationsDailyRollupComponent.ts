import {ChangeDetectionStrategy, Component, effect, inject, OnInit, signal} from '@angular/core';
import {ButtonDirective, ButtonIcon, ButtonLabel} from 'primeng/button';
import {FormsModule} from '@angular/forms';
import {AgChartOptions} from 'ag-charts-community';
import {AgCharts} from 'ag-charts-angular';
import {ProgressSpinner} from 'primeng/progressspinner';
import {DataService} from '../../../core/services/DataService';
import {FilterDrawerComponent} from '../../shared/components/FilterDrawerComponent/FilterDrawerComponent';
import {FiltersService} from '../../../core/services/FiltersService';
import {applyCommonFilters} from '../../shared/utils/applyFilters';
import {PageHeaderComponent} from '../../shared/components/PageHeaderComponent/PageHeaderComponent';
import {Select} from 'primeng/select';


@Component({
  selector: 'app-visualizations',
  templateUrl: './VisualizationsDailyRollupComponent.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonDirective, ButtonIcon, ButtonLabel, FormsModule, AgCharts, ProgressSpinner, FilterDrawerComponent, PageHeaderComponent, Select],
  providers: [],
  styleUrls: ['./VisualizationsDailyRollupComponent.scss']
})
export class VisualizationsDailyRollupComponent implements OnInit {

    // Facet selections
  selectedSource = signal<string | null>(null);
  selectedPlatform = signal<string | null>(null);
  selectedCountry = signal<string | null>(null);
  selectedReleaseChannel = signal<string | null>(null);
  // Chart options
  eventsByPlatformGroupedOptions!: AgChartOptions;
  simplePerformanceChartOptions!: AgChartOptions;
  eventsChartOptions!: AgChartOptions;
  platformChartOptions!: AgChartOptions;
  deviceTierChartOptions!: AgChartOptions;
  countryChartOptions!: AgChartOptions;
  appStartPercentilesChartOptions!: AgChartOptions;
  filters!: Filter[];
  visible = signal(false);
  // Charts
  chartLoaded: any = false;
  protected filtersService = inject(FiltersService);
  protected readonly print = print;
  private dataService = inject(DataService);
  public data = this.dataService.filteredDailyRollups;
  loading = this.dataService.loading;
  error = this.dataService.error;
  eventTypes!: any[];

  constructor() {
    effect(() => {
      let appStartPerformanceOverTime = this.preparePerformanceData();
      let eventGroupDistribution = this.getEventGroupDistribution();
      let platformDistribution = this.getPlatformDistribution();
      let deviceTierPerformance = this.getAppStartByDeviceTier();
      let countryDistribution = this.getCountryDistribution();
      let appStartPercentilesOverTime = this.getAppStartPercentilesOverTime();

      this.chartLoaded = true;

      // Chart 1: App Start Performance Over Time
      this.simplePerformanceChartOptions = {
        title: {
          text: 'App Start Performance (Average Duration)',
        }, data: appStartPerformanceOverTime, series: [{
          type: 'line',
          xKey: 'day',
          yKey: 'avg_duration_ms',
          yName: 'App Start Time (ms)',
          stroke: '#2563eb',
          strokeWidth: 3,
          marker: {
            enabled: true, size: 6, fill: '#2563eb', stroke: '#ffffff', strokeWidth: 2
          }
        }], axes: [{
          type: 'time', position: 'bottom', title: {
            text: 'Date',
          },
        }, {
          type: 'number', position: 'left', title: {
            text: 'Duration (ms)',
          }, min: 0
        }]
      };

      // Chart 2: Event Group Distribution (by Events)
      this.eventsChartOptions = {
        title: {
          text: 'Event Group Distribution',
        }, data: [...eventGroupDistribution], series: [{
          type: 'pie', angleKey: 'events_count', legendItemKey: 'event_group', calloutLabelKey: 'event_group',
        },],
      };

      // Chart 3: Platform Distribution (by Events)
      this.platformChartOptions = {
        title: {
          text: 'Usage by Platform and Event Type',
        },
        data: this.getPlatformEventChartData(),
        series: this.eventTypes.map(event => ({
          type: 'bar',
          xKey: 'platform',
          yKey: event,
          stacked: true,
          yName: event.replace('_', ' ').toUpperCase()
        })),
        axes: [
          {
            type: 'category',
            position: 'bottom',
          },
          {
            type: 'number',
            position: 'left',
            title: {
              text: 'Number of Events',
            },
          },
        ],
      };

      // Chart 4: App Start Performance by Device Tier (avg duration)
      this.deviceTierChartOptions = {
        title: {
          text: 'App Start Performance by Device Tier',
        },
        data: [...deviceTierPerformance],
        series: [{
          type: 'bar', xKey: 'device_tier', yKey: 'avg_duration_ms', yName: 'Average Duration (ms)',
        },],
        axes: [{type: 'category', position: 'bottom', title: {text: 'Device Tier'}}, {
          type: 'number',
          position: 'left',
          title: {text: 'Average Duration (ms)'}
        },],
      };

      // Chart 5: Events by Country
      this.countryChartOptions = {
        title: {
          text: 'Events by Country',
        }, data: [...countryDistribution], series: [{
          type: 'pie', angleKey: 'events_count', legendItemKey: 'country', calloutLabelKey: 'country',
        },],
      };

      // Chart 6: App Start Percentiles Over Time (P50/P90/P99)
      this.appStartPercentilesChartOptions = {
        title: {
          text: 'App Start Percentiles Over Time',
        },
        data: [...appStartPercentilesOverTime],
        series: [{type: 'line', xKey: 'day', yKey: 'p50_duration_ms', yName: 'P50 (ms)'}, {
          type: 'line',
          xKey: 'day',
          yKey: 'p90_duration_ms',
          yName: 'P90 (ms)'
        }, {type: 'line', xKey: 'day', yKey: 'p99_duration_ms', yName: 'P99 (ms)'},],
        axes: [{type: 'category', position: 'bottom', title: {text: 'Date'}}, {
          type: 'number',
          position: 'left',
          title: {text: 'Duration (ms)'}
        },],
      };
    });


  }

  // Options for dropdowns derived from current data
  sourceOptions = () => uniqSorted((this.data() || []).map((r: any) => r.source).filter(Boolean));

  platformOptions = () => uniqSorted((this.data() || []).map((r: any) => r.platform).filter(Boolean));

  countryOptions = () => uniqSorted((this.data() || []).map((r: any) => r.country).filter(Boolean));

  releaseChannelOptions = () => uniqSorted((this.data() || []).map((r: any) => r.release_channel).filter(Boolean));

  // Derived filtered data applying search/query/facets in addition to date range
  public viewData = () => applyCommonFilters(this.data() || [], {
    searchText: this.filtersService.searchText(), query: this.filtersService.customQuery(), facets: {
      source: this.selectedSource(),
      platform: this.selectedPlatform(),
      country: this.selectedCountry(),
      release_channel: this.selectedReleaseChannel(),
    }, stringify: (row: any) => [row.day, row.source, row.platform, row.country, row.app_id, row.event_group]
      .map((v: any) => String(v ?? '')).join(' ')
  });

  savedConfigNames = () => (this.filtersService.savedConfigs() || []).map(c => c.name);

  // App Start Performance
  preparePerformanceData() {
    return this.viewData()
      .filter(item => item.event_group === 'performance:app_start')
      .map(item => ({
        day: new Date(item.day),
        avg_duration_ms: item.avg_duration_ms,
        p50_duration_ms: item.p50_duration_ms,
        p90_duration_ms: item.p90_duration_ms,
        p99_duration_ms: item.p99_duration_ms,
        platform: item.platform,
        device_tier: item.device_tier,
        country: item.country
      }))
      .sort((a, b) => a.day.getTime() - b.day.getTime());
  };

  // Distribution of events_count by event_group
  getEventGroupDistribution() {
    const groups: Record<string, number> = {};
    (this.viewData() || []).forEach((item: any) => {
      const key = item.event_group || 'unknown';
      groups[key] = (groups[key] || 0) + (item.events_count || 0);
    });
    return Object.keys(groups).map(event_group => ({event_group, events_count: groups[event_group]}));
  }

  // Sum events_count by platform
  getPlatformDistribution() {
    const platforms: Record<string, number> = {};
    (this.viewData() || []).forEach((item: any) => {
      const key = item.platform || 'unknown';
      platforms[key] = (platforms[key] || 0) + (item.events_count || 0);
    });
    return Object.keys(platforms).map(platform => ({platform, events_count: platforms[platform]}));
  }

  // Get Events by platform
  getPlatformEventChartData() {
    const platformEventData: any = {};

    // First, collect all unique events for stacking
    (this.viewData() || []).forEach((item: any) => {
      if (!platformEventData[item.platform]) {
        platformEventData[item.platform] = {};
      }
      platformEventData[item.platform][item.event_group] =
        (platformEventData[item.platform][item.event_group] || 0) + 1;
    });

    const allEvents = new Set();
    (this.viewData() || []).forEach(item => allEvents.add(item.event_group));
    this.eventTypes = Array.from(allEvents);

    // Transform data for stacked bar chart
    return Object.keys(platformEventData).map((platform) => {
      const platformEntry: any = { platform };

      this.eventTypes.forEach(event => {
        platformEntry[event] = platformEventData[platform][event] || 0;
      });

      return platformEntry;
    });
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

    // Create an array of results
    const results = Object.keys(sumCounts).map(device_tier => ({
      device_tier,
      avg_duration_ms: Math.round(sumWeighted[device_tier] / (sumCounts[device_tier] || 1))
    }));

    // Define the desired order
    const tierOrder = ['low', 'mid', 'high'];

    return results.sort((a, b) => {
      const aIndex = tierOrder.indexOf(a.device_tier);
      const bIndex = tierOrder.indexOf(b.device_tier);

      // Handle unknown tiers by placing them at the end
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;

      return aIndex - bIndex;
    });
  }

  // Sum events_count by country
  getCountryDistribution() {
    const countries: Record<string, number> = {};
    (this.viewData() || []).forEach((item: any) => {
      const key = item.country || 'unknown';
      countries[key] = (countries[key] || 0) + (item.events_count || 0);
    });
    return Object.keys(countries).map(country => ({country, events_count: countries[country]}));
  }

  // Weighted average percentiles per day for app_start
  getAppStartPercentilesOverTime() {
    const byDay: Record<string, { w: number; p50: number; p90: number; p99: number }> = {};
    (this.viewData() || [])
      .filter((item: any) => item.source === 'performance' && item.event_group === 'performance:app_start')
      .forEach((item: any) => {
        const w = item.events_count || 0;
        const d = item.day;
        if (!byDay[d]) byDay[d] = {w: 0, p50: 0, p90: 0, p99: 0};
        byDay[d].w += w;
        if (typeof item.p50_duration_ms === 'number') byDay[d].p50 += item.p50_duration_ms * w;
        if (typeof item.p90_duration_ms === 'number') byDay[d].p90 += item.p90_duration_ms * w;
        if (typeof item.p99_duration_ms === 'number') byDay[d].p99 += item.p99_duration_ms * w;
      });

    return Object.keys(byDay)
      .sort()
      .map(day => ({
        day: formatDateWithOrdinal(new Date(day)),
        p50_duration_ms: Math.round(byDay[day].p50 / (byDay[day].w || 1)),
        p90_duration_ms: Math.round(byDay[day].p90 / (byDay[day].w || 1)),
        p99_duration_ms: Math.round(byDay[day].p99 / (byDay[day].w || 1)),
      }));
  }

  async ngOnInit() {
// Transform data for events by platform visualization
    const prepareEventsPlatformData = (rawData: any[]) => {
      const eventData: any = {};

      rawData.forEach(item => {
        const eventKey = item.event_group;
        if (!eventData[eventKey]) {
          eventData[eventKey] = {
            event_group: eventKey,
            event_display: item.event_group.replace(':', ' - ').replace(/_/g, ' '),
            web: 0,
            android: 0,
            ios: 0
          };
        }

        const count = item.events_count || 0;
        eventData[eventKey][item.platform] += count;
      });

      return Object.values(eventData);
    };

// Option 1: Grouped Bar Chart (Recommended) - Shows event types side by side per platform
    this.eventsByPlatformGroupedOptions = {
      title: {
        text: 'Event Types Across Platforms', fontSize: 16, fontWeight: 'bold'
      }, data: prepareEventsPlatformData(this.data()), series: [{
        type: 'bar',
        direction: 'horizontal',
        xKey: 'web',
        yKey: 'event_display',
        xName: 'Web',
        grouped: true,
        fill: '#3b82f6',
        stroke: '#ffffff',
        strokeWidth: 1
      }, {
        type: 'bar',
        direction: 'horizontal',
        xKey: 'android',
        yKey: 'event_display',
        xName: 'Android',
        grouped: true,
        fill: '#10b981',
        stroke: '#ffffff',
        strokeWidth: 1
      }, {
        type: 'bar',
        direction: 'horizontal',
        xKey: 'ios',
        yKey: 'event_display',
        xName: 'iOS',
        grouped: true,
        fill: '#f59e0b',
        stroke: '#ffffff',
        strokeWidth: 1
      }], axes: [], legend: {
        position: 'bottom',
      }
    };
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
        if (!isNaN(from.getTime()) && !isNaN(to.getTime())) this.dataService.setDateRange({from, to});
      } catch {
      }
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
}

function uniqSorted(arr: (string | null | undefined)[]): string[] {
  const set = new Set<string>();
  for (const v of arr) {
    if (v != null) set.add(String(v));
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

interface Filter {
  name: string,
  code: string
}

function formatDateWithOrdinal(date: any) {
  const day = date.getDate();
  const ordinal = getOrdinalSuffix(day);

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short'
  }).format(date).replace(/\d+/, day + ordinal);
}

function getOrdinalSuffix(day: any) {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}
