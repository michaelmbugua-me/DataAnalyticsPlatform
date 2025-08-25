import {Component, inject, OnInit, signal} from '@angular/core';
import {Drawer} from 'primeng/drawer';
import {Button, ButtonDirective, ButtonIcon, ButtonLabel} from 'primeng/button';
import {Listbox} from 'primeng/listbox';
import {FormsModule} from '@angular/forms';
import {AgChartOptions} from 'ag-charts-community';
import {AgCharts} from 'ag-charts-angular';
import {ProgressSpinner} from 'primeng/progressspinner';
import {DataService} from '../../../core/services/DataService';


@Component({
  selector: 'app-visualizations',
  templateUrl: './VisualizationsDailyRollupComponent.html',
  imports: [Drawer, ButtonDirective, ButtonIcon, ButtonLabel, Listbox, FormsModule, Button, AgCharts, ProgressSpinner],
  providers: [],
  styleUrls: ['./VisualizationsDailyRollupComponent.scss']
})
export class VisualizationsDailyRollupComponent implements OnInit {

  private dataService = inject(DataService);

  public data = this.dataService.data;
  loading = this.dataService.loading;
  error = this.dataService.error;


  performanceData: any;
  eventDistribution: any;
  platformData: any;
  deviceTierData: any;
  countryChartData: any;
  networkChartData: any;
  performanceChartOptions!: AgChartOptions;
  eventsChartOptions!: AgChartOptions;
  platformChartOptions!: AgChartOptions;
  deviceTierChartOptions!: AgChartOptions;
  countryChartOptions!: AgChartOptions;
  networkChartOptions!: AgChartOptions;

  filters!: Filter[];

  selectedFilter!: Filter;

  visible = signal(false);

  // Charts
  chartLoaded: any = false;

  constructor() {
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
      .filter(item => item.duration_ms)
      .forEach(item => {
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
      .filter(item => item.duration_ms && item.network_type)
      .forEach(item => {
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

    this.performanceData = this.getPerformanceData();
    this.eventDistribution = this.getEventDistribution();
    this.platformData = this.getPlatformData();
    this.deviceTierData = this.getDeviceTierData();
    this.countryChartData = this.getCountryData();
    this.networkChartData = this.getNetworkData();

    this.chartLoaded = true;

    // Chart 1: Performance Over Time (App Start Duration)
    this.performanceChartOptions = {
      title: {
        text: 'App Start Performance Over Time',
      }, data: this.performanceData, series: [{
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
      }, data: this.eventDistribution, series: [{
        type: 'pie', angleKey: 'count', legendItemKey: 'event', calloutLabelKey: 'event'
      }],
    };

    // Chart 3: Platform Usage
    this.platformChartOptions = {
      title: {
        text: 'Usage by Platform',
      },
      data: this.getPlatformData(),
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
      data: this.deviceTierData,
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
      data: this.getCountryData(),
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
      data: this.networkChartData,
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


    this.filters = [{name: 'Today\'s records', code: 'NY'}, {
      name: 'This weeks\'s records', code: 'RM'
    }, {name: 'This month\'s records', code: 'LDN'}, {name: 'This year\'s records', code: 'IST'}];
  }

  toggleFilterVisibility() {
    this.visible.update(v => !v);
  }
}

interface Filter {
  name: string,
  code: string
}

