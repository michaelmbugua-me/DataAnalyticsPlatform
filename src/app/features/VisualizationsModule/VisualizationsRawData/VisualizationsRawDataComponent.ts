import {Component, effect, inject, OnInit, signal, ChangeDetectionStrategy} from '@angular/core';
import { ButtonDirective, ButtonIcon, ButtonLabel} from 'primeng/button';
import {FormsModule} from '@angular/forms';
import {AgChartOptions, AgCartesianChartOptions} from 'ag-charts-community';
import {AgCharts} from 'ag-charts-angular';
import {ProgressSpinner} from 'primeng/progressspinner';
import {DataService} from '../../../core/services/DataService';
import {FilterDrawerComponent} from '../../shared/components/FilterDrawerComponent/FilterDrawerComponent';
import { FiltersService } from '../../../core/services/FiltersService';
import { applyCommonFilters } from '../../shared/utils/applyFilters';
import {PageHeaderComponent} from '../../shared/components/PageHeaderComponent/PageHeaderComponent';
import {Select} from 'primeng/select';


@Component({
  selector: 'app-visualizations',
  templateUrl: './VisualizationsRawDataComponent.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonDirective, ButtonIcon, ButtonLabel, FormsModule, AgCharts, ProgressSpinner, FilterDrawerComponent, PageHeaderComponent, Select],
  providers: [],
  styleUrls: ['./VisualizationsRawDataComponent.scss']
})
export class VisualizationsRawDataComponent implements OnInit {

  private dataService = inject(DataService);
  protected filtersService = inject(FiltersService);

  public data = this.dataService.filteredRawData;
  error = this.dataService.error;

  // Facet selections
  selectedSource = signal<string | null>(null);
  selectedPlatform = signal<string | null>(null);
  selectedCountry = signal<string | null>(null);
  selectedReleaseChannel = signal<string | null>(null);

  // Options derived from current data
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
    stringify: (row: any) => [row.id, row.event_name, row.platform, row.country, row.app_id, row.source, row.release_channel]
      .map((v: any) => String(v ?? '')).join(' ')
  });


  simplePerformanceChartOptions!: AgCartesianChartOptions;
  performanceChartOptions!: AgChartOptions;
  eventsChartOptions!: AgChartOptions;
  platformChartOptions!: AgChartOptions;
  deviceTierChartOptions!: AgChartOptions;
  countryChartOptions!: AgChartOptions;
  networkChartOptions!: AgChartOptions;
  crashChartOptions!: AgChartOptions;
  crashByChannelChartOptions!: AgChartOptions;

  filters!: Filter[];

  savedConfigNames = () => (this.filtersService.savedConfigs() || []).map(c => c.name);

  visible = signal(false);

  // Charts
  chartLoaded: any = false;
  eventTypes!: any[];

  constructor() {

    effect(() => {

      // Derive datasets from current filtered rows
      let appStartPerformanceOverTime = this.prepareRawPerformanceData();
      const eventDistribution = this.getEventDistribution();
      const deviceTierData = this.getDeviceTierData();
      const countryChartData = this.getCountryData();
      const networkChartData = this.getNetworkData();
      const crashDataResult = this.getCrashDataByVersion();
      const crashByChannelDataResult = this.getCrashDataByReleaseChannel();

      this.chartLoaded = true;

      // Chart 1: Performance Over Time (App Start Duration)
      this.simplePerformanceChartOptions = {
        title: {
          text: 'App Start Performance Trends',
        },
        subtitle: {
          text: 'Daily average app start time with key percentiles'
        },
        data: this.prepareRawPerformanceData(),
        series: [
          {
            type: 'line',
            xKey: 'day',
            yKey: 'avg_duration_ms',
            yName: 'Average',
            stroke: '#2563eb',
            strokeWidth: 3,
            marker: {
              enabled: true,
              size: 6,
              fill: '#2563eb'
            }
          },
          {
            type: 'line',
            xKey: 'day',
            yKey: 'max_duration_ms',
            yName: 'Maximum',
            stroke: '#f59e0b',
            strokeWidth: 2,
            lineDash: [4, 4],
            marker: {
              enabled: true,
              size: 4,
              fill: '#f59e0b'
            }
          },
          {
            type: 'line',
            xKey: 'day',
            yKey: 'min_duration_ms',
            yName: 'Minimum',
            stroke: '#327c1f',
            strokeWidth: 2,
            lineDash: [4, 4],
            marker: {
              enabled: true,
              size: 4,
              fill: '#327c1f'
            }
          }
        ],
        axes: [
          {
            type: 'time',
            position: 'bottom',
            title: {
              text: 'Date',
            },
            label: {
              format: '%b %d',
              rotation: 45
            }
          },
          {
            type: 'number',
            position: 'left',
            title: {
              text: 'Duration (ms)',
            },
            min: 0
          }
        ],
        legend: {
          position: 'bottom'
        }
      };

      // Chart 2: Event Distribution
      this.eventsChartOptions = {
        title: {
          text: 'User Event Distribution',
        }, data: [...eventDistribution], series: [{
          type: 'pie', angleKey: 'count', legendItemKey: 'event', calloutLabelKey: 'event'
        }],
      };

      // Chart 3: Platform Usage
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

      // Chart 4: Performance by Device Tier
      this.deviceTierChartOptions = {
        title: {
          text: 'Performance by Device Tier',
        },
        data: [...deviceTierData],
        series: [
          {
            type: 'bar',
            xKey: 'device_tier',
            yKey: 'avg_duration',
            yName: 'Average Duration (ms)',
          },
        ],
        axes: [
          {
            type: 'category',
            position: 'bottom',
            title: {
              text: 'Device Tier',
            },
          },
          {
            type: 'number',
            position: 'left',
            title: {
              text: 'Average Duration (ms)',
            },
          },
        ],
      };

      // Chart 5: Usage by Country
      this.countryChartOptions = {
        title: {
          text: 'Usage by Country',
        },
        data: [...countryChartData],
        series: [
          {
            type: 'pie',
            angleKey: 'count',
            legendItemKey: 'country',
            calloutLabelKey: 'country',
          },
        ],
      };

      // Chart 6: Performance by Network Type
      this.networkChartOptions = {
        title: {
          text: 'Performance by Network Type',
        },
        data: [...networkChartData],
        series: [
          {
            type: 'bar',
            xKey: 'network_type',
            yKey: 'avg_duration',
            yName: 'Average Duration (ms)',
          },
        ],
        axes: [
          {
            type: 'category',
            position: 'bottom',
            title: {
              text: 'Network Type',
            },
          },
          {
            type: 'number',
            position: 'left',
            title: {
              text: 'Average Duration (ms)',
            },
          },
        ],
      };

      // Chart 7: Crashes and crash types by app_version
      this.crashChartOptions = {
        title: {
          text: 'Crashes by App Version',
        },
        data: crashDataResult.data,
        series: crashDataResult.crashGroupTypes.map(crashGroup => ({
          type: 'bar',
          xKey: 'app_version',
          yKey: crashGroup as string,
          stacked: true,
          yName: formatCrashGroupName(crashGroup)
        })),
        axes: [
        ],
        legend: {
          position: 'bottom'
        }
      };

      // Chart 8: Crashes and crash types by release channel
      this.crashByChannelChartOptions = {
        title: {
          text: 'Crashes by Release Channel',
        },
        data: crashByChannelDataResult.data,
        series: crashByChannelDataResult.crashGroupTypes.map(crashGroup => ({
          type: 'bar',
          xKey: 'app_version',
          yKey: crashGroup as string,
          stacked: true,
          yName: formatCrashGroupName(crashGroup)
        })),
        axes: [
        ],
        legend: {
          position: 'bottom'
        }
      };

    });

  }

  prepareRawPerformanceData() {
    const appStartData = this.viewData()
      .filter((item: any) => item.event_name === 'app_start' && item.duration_ms)
      .map((item: any) => ({
        day: new Date(item.day),
        duration_ms: item.duration_ms,
        platform: item.platform,
        device_tier: item.device_tier,
        country: item.country,
        app_version: item.app_version,
        network_type: item.network_type
      }))
      .sort((a, b) => a.day.getTime() - b.day.getTime());

    // Group by day and calculate statistics
    const dailyData: any = {};

    appStartData.forEach(item => {
      const dayKey = item.day.toISOString().split('T')[0];

      if (!dailyData[dayKey]) {
        dailyData[dayKey] = {
          day: item.day,
          durations: [],
          platforms: new Set(),
          device_tiers: new Set(),
          countries: new Set()
        };
      }

      dailyData[dayKey].durations.push(item.duration_ms);
      dailyData[dayKey].platforms.add(item.platform);
      dailyData[dayKey].device_tiers.add(item.device_tier);
      dailyData[dayKey].countries.add(item.country);
    });

    // Calculate metrics for each day
    return Object.values(dailyData).map((dayData: any) => {
      const durations = dayData.durations.sort((a: number, b: number) => a - b);
      const count = durations.length;

      return {
        day: dayData.day,
        avg_duration_ms: Math.round(durations.reduce((sum: number, val: number) => sum + val, 0) / count),
        min_duration_ms: durations[0],
        max_duration_ms: durations[count - 1],
        total_events: count,
        platforms_active: dayData.platforms.size,
        device_tiers_active: dayData.device_tiers.size,
        countries_active: dayData.countries.size
      };
    });
  };

  getEventDistribution() {
    const eventCounts: any = {};
    (this.viewData() || []).forEach((item: any) => {
      if (item.event_name) {
        eventCounts[item.event_name] = (eventCounts[item.event_name] || 0) + 1;
      }
    });

    return Object.keys(eventCounts).map(event => ({
      event, count: eventCounts[event]
    }));
  }

  getDeviceTierData() {
    const tierData: any = {};
    const tierCounts: any = {};

    (this.viewData() || [])
      .filter((item: any) => item.duration_ms)
      .forEach((item: any) => {
        if (!tierData[item.device_tier]) {
          tierData[item.device_tier] = 0;
          tierCounts[item.device_tier] = 0;
        }
        tierData[item.device_tier] += item.duration_ms;
        tierCounts[item.device_tier]++;
      });

    // Define the desired order
    const tierOrder = ['low', 'mid', 'medium', 'high'];

    return Object.keys(tierData)
      .map(tier => ({
        device_tier: tier,
        avg_duration: Math.round(tierData[tier] / (tierCounts[tier] || 1))
      }))
      .sort((a, b) => {
        const indexA = tierOrder.indexOf(a.device_tier.toLowerCase());
        const indexB = tierOrder.indexOf(b.device_tier.toLowerCase());

        // If tier not found in order array, put it at the end
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;

        return indexA - indexB;
      });
  }

  getCountryData() {
    const countryCounts: any = {};
    (this.viewData() || []).forEach(item => {
      const key = item.country || 'unknown';
      countryCounts[key] = (countryCounts[key] || 0) + 1;
    });

    return Object.keys(countryCounts).map(country => ({
      country,
      count: countryCounts[country]
    }));
  }

  getNetworkData() {
    const networkData: any = {};
    const networkCounts: any = {};

    (this.viewData() || [])
      .filter((item: any) => item.duration_ms && item.network_type)
      .forEach((item: any) => {
        if (!networkData[item.network_type]) {
          networkData[item.network_type] = 0;
          networkCounts[item.network_type] = 0;
        }
        networkData[item.network_type] += item.duration_ms;
        networkCounts[item.network_type]++;
      });

    return Object.keys(networkData).map(network => ({
      network_type: network,
      avg_duration: Math.round(networkData[network] / (networkCounts[network] || 1))
    }));
  }

  getPlatformEventChartData() {
    const platformEventData: any = {};

    // First, collect all unique events for stacking
    (this.viewData() || []).forEach((item: any) => {
      if (!platformEventData[item.platform]) {
        platformEventData[item.platform] = {};
      }
      platformEventData[item.platform][item.event_name] =
        (platformEventData[item.platform][item.event_name] || 0) + 1;
    });

    const allEvents = new Set();
    (this.viewData() || []).forEach(item => allEvents.add(item.event_name));
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

  getCrashDataByVersion() {
    const crashData: any = {};

    // Filter for crash events only
    (this.viewData() || []).filter(item => item.is_crash === 1).forEach((item: any) => {
      const versionKey = item.app_version;

      if (!crashData[versionKey]) {
        crashData[versionKey] = {
          total: 0,
          crashGroups: {}
        };
      }

      crashData[versionKey].total += 1;

      // Use crash_group_id if available, otherwise use exception_type as fallback
      const crashGroup = item.crash_group_id || item.exception_type || 'unknown';
      crashData[versionKey].crashGroups[crashGroup] =
        (crashData[versionKey].crashGroups[crashGroup] || 0) + 1;
    });

    // Get all unique crash groups for stacking
    const allCrashGroups = new Set();
    (this.viewData() || []).filter((item: any) => item.is_crash === 1).forEach((item: any) => {
      const crashGroup = item.crash_group_id || item.exception_type || 'unknown';
      allCrashGroups.add(crashGroup);
    });
    const crashGroupTypes = Array.from(allCrashGroups);

    // Transform data for stacked bar chart
    return {
      data: Object.keys(crashData).map((version) => {
        const versionEntry: any = {
          app_version: version,
          total: crashData[version].total
        };

        crashGroupTypes.forEach((group: any) => {
          versionEntry[group] = crashData[version].crashGroups[group] || 0;
        });

        return versionEntry;
      }),
      crashGroupTypes: crashGroupTypes
    };
  }

  getCrashDataByReleaseChannel() {
    const crashData: any = {};

    // Filter for crash events only
    (this.viewData() || []).filter(item => item.is_crash === 1).forEach((item: any) => {
      const versionKey = item.release_channel;

      if (!crashData[versionKey]) {
        crashData[versionKey] = {
          total: 0,
          crashGroups: {}
        };
      }

      crashData[versionKey].total += 1;

      // Use crash_group_id if available, otherwise use exception_type as fallback
      const crashGroup = item.crash_group_id || item.exception_type || 'unknown';
      crashData[versionKey].crashGroups[crashGroup] =
        (crashData[versionKey].crashGroups[crashGroup] || 0) + 1;
    });

    // Get all unique crash groups for stacking
    const allCrashGroups = new Set();
    (this.viewData() || []).filter((item: any) => item.is_crash === 1).forEach((item: any) => {
      const crashGroup = item.crash_group_id || item.exception_type || 'unknown';
      allCrashGroups.add(crashGroup);
    });
    const crashGroupTypes = Array.from(allCrashGroups);

    // Transform data for stacked bar chart
    return {
      data: Object.keys(crashData).map((version) => {
        const versionEntry: any = {
          app_version: version,
          total: crashData[version].total
        };

        crashGroupTypes.forEach((group: any) => {
          versionEntry[group] = crashData[version].crashGroups[group] || 0;
        });

        return versionEntry;
      }),
      crashGroupTypes: crashGroupTypes
    };
  }

  async ngOnInit() {

    this.filters = [{name: 'Today\'s records', code: 'NY'}, {
      name: 'This weeks\'s records', code: 'RM'
    }, {name: 'This month\'s records', code: 'LDN'}, {name: 'This year\'s records', code: 'IST'}];
  }

  toggleFilterVisibility() {
    this.visible.update(v => !v);
  }



  protected readonly Date = Date;

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

  printScreen() {
    window.print();
  }

  preparePlatformComparisonData() {
    const platformData: any = {};

    this.viewData()
      .filter((item: any) => item.event_name === 'app_start' && item.duration_ms)
      .forEach((item: any) => {
        if (!platformData[item.platform]) {
          platformData[item.platform] = [];
        }
        platformData[item.platform].push(item.duration_ms);
      });

    return Object.entries(platformData).map(([platform, durations]: [string, any]) => {
      const sorted = durations.sort((a: number, b: number) => a - b);
      const count = sorted.length;

      return {
        platform,
        avg_duration: Math.round(sorted.reduce((sum: number, val: number) => sum + val, 0) / count),
        p90_duration: sorted[Math.floor(count * 0.9)],
        sample_size: count
      };
    });
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


// Helper to format crash group names for display
function formatCrashGroupName(crashGroup: any): string {
  return crashGroup
    .replace('cg_', '')
    .replace(/_/g, ' ')
    .split(' ')
    .map((word: any) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
