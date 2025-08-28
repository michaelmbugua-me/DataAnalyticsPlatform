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
import {Select} from 'primeng/select';


@Component({
  selector: 'app-visualizations',
  templateUrl: './VisualizationsRawDataComponent.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonDirective, ButtonIcon, ButtonLabel, FormsModule, Button, AgCharts, ProgressSpinner, FilterDrawerComponent, PageHeaderComponent, Select],
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

  performanceChartOptions!: AgChartOptions;
  eventsChartOptions!: AgChartOptions;
  platformChartOptions!: AgChartOptions;
  deviceTierChartOptions!: AgChartOptions;
  countryChartOptions!: AgChartOptions;
  networkChartOptions!: AgChartOptions;

  filters!: Filter[];

  savedConfigNames = () => (this.filtersService.savedConfigs() || []).map(c => c.name);

  visible = signal(false);

  // Charts
  chartLoaded: any = false;

  constructor() {

    effect(() => {

      // Derive datasets from current filtered rows
      const performanceData = this.getPerformanceData();
      const eventDistribution = this.getEventDistribution();
      const platformData = this.getPlatformData();
      const deviceTierData = this.getDeviceTierData();
      const countryChartData = this.getCountryData();
      const networkChartData = this.getNetworkData();

      this.chartLoaded = true;

      // Chart 1: Performance Over Time (App Start Duration)
      this.performanceChartOptions = {
        title: {
          text: 'App Start Performance Over Time',
        }, data: [...performanceData], series: [{
          type: 'line', xKey: 'day', yKey: 'duration_ms', yName: 'App Start Time (ms)',
        },], axes: [{
          type: 'category', position: 'bottom', title: {
            text: 'Date',
          },
        }, {
          type: 'number', position: 'left', title: {
            text: 'Duration (ms)',
          },
        },],
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
          text: 'Usage by Platform',
        },
        data: [...platformData],
        series: [
          {
            type: 'bar',
            xKey: 'platform',
            yKey: 'count',
          },
        ],
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

    });

  }

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

  getPerformanceData() {
    return (this.viewData() || [])
      .filter((item: any) => item.source === 'performance' && item.perf_type === 'app_start')
      .map((item: any) => ({
        day: item.day, duration_ms: item.duration_ms, platform: item.platform
      }));
  }

  getPlatformData() {
    const platformCounts: any = {};
    (this.viewData() || []).forEach((item: any) => {
      platformCounts[item.platform] = (platformCounts[item.platform] || 0) + 1;
    });

    return Object.keys(platformCounts).map((platform) => ({
      platform,
      count: platformCounts[platform]
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

    return Object.keys(tierData).map(tier => ({
      device_tier: tier,
      avg_duration: Math.round(tierData[tier] / (tierCounts[tier] || 1))
    }));
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

