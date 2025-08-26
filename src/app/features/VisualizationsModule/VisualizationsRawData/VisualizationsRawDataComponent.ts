import {Component, effect, inject, OnInit, signal, ChangeDetectionStrategy} from '@angular/core';
import {Button, ButtonDirective, ButtonIcon, ButtonLabel} from 'primeng/button';
import {FormsModule} from '@angular/forms';
import {AgChartOptions} from 'ag-charts-community';
import {AgCharts} from 'ag-charts-angular';
import {ProgressSpinner} from 'primeng/progressspinner';
import {DataService} from '../../../core/services/DataService';
import {FilterDrawerComponent} from '../../shared/components/filter-drawer';


@Component({
  selector: 'app-visualizations',
  templateUrl: './VisualizationsRawDataComponent.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonDirective, ButtonIcon, ButtonLabel, FormsModule, Button, AgCharts, ProgressSpinner, FilterDrawerComponent],
  providers: [],
  styleUrls: ['./VisualizationsRawDataComponent.scss']
})
export class VisualizationsRawDataComponent implements OnInit {

  private dataService = inject(DataService);

  public data = this.dataService.filteredRawData;
  error = this.dataService.error;



  performanceChartOptions!: AgChartOptions;
  eventsChartOptions!: AgChartOptions;
  platformChartOptions!: AgChartOptions;
  deviceTierChartOptions!: AgChartOptions;
  countryChartOptions!: AgChartOptions;
  networkChartOptions!: AgChartOptions;

  filters!: Filter[];



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
    this.data().forEach((item: any) => {
      if (item.event_name) {
        eventCounts[item.event_name] = (eventCounts[item.event_name] || 0) + 1;
      }
    });

    return Object.keys(eventCounts).map(event => ({
      event, count: eventCounts[event]
    }));
  }

  getPerformanceData() {
    return this.data()
      .filter(item => item.source === 'performance' && item.perf_type === 'app_start')
      .map(item => ({
        day: item.day, duration_ms: item.duration_ms, platform: item.platform
      }));
  }

  getPlatformData() {
    const platformCounts: any = {};
    this.data().forEach((item: any) => {
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

    this.data()
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
      avg_duration: Math.round(tierData[tier] / tierCounts[tier])
    }));
  }

  getCountryData() {
    const countryCounts: any = {};
    this.data().forEach(item => {
      countryCounts[item.country] = (countryCounts[item.country] || 0) + 1;
    });

    return Object.keys(countryCounts).map(country => ({
      country,
      count: countryCounts[country]
    }));
  }

  getNetworkData() {
    const networkData: any = {};
    const networkCounts: any = {};

    this.data()
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
      avg_duration: Math.round(networkData[network] / networkCounts[network])
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
}

interface Filter {
  name: string,
  code: string
}

