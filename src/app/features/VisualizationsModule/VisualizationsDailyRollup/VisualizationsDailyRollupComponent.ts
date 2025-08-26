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
  templateUrl: './VisualizationsDailyRollupComponent.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonDirective, ButtonIcon, ButtonLabel, FormsModule, Button, AgCharts, ProgressSpinner, FilterDrawerComponent],
  providers: [],
  styleUrls: ['./VisualizationsDailyRollupComponent.scss']
})
export class VisualizationsDailyRollupComponent implements OnInit {

  private dataService = inject(DataService);

  public data = this.dataService.filteredDailyRollups;
  loading = this.dataService.loading;
  error = this.dataService.error;

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
    this.data().forEach((item: any) => {
      byDay[item.day] = (byDay[item.day] || 0) + (item.events_count || 0);
    });
    return Object.keys(byDay)
      .sort()
      .map(day => ({ day, events_count: byDay[day] }));
  }

  // Distribution of events_count by event_group
  getEventGroupDistribution() {
    const groups: Record<string, number> = {};
    this.data().forEach((item: any) => {
      const key = item.event_group || 'unknown';
      groups[key] = (groups[key] || 0) + (item.events_count || 0);
    });
    return Object.keys(groups).map(event_group => ({ event_group, events_count: groups[event_group] }));
  }

  // Sum events_count by platform
  getPlatformDistribution() {
    const platforms: Record<string, number> = {};
    this.data().forEach((item: any) => {
      const key = item.platform || 'unknown';
      platforms[key] = (platforms[key] || 0) + (item.events_count || 0);
    });
    return Object.keys(platforms).map(platform => ({ platform, events_count: platforms[platform] }));
  }

  // Weighted average app_start avg_duration_ms by device_tier
  getAppStartByDeviceTier() {
    const sumWeighted: Record<string, number> = {};
    const sumCounts: Record<string, number> = {};
    this.data()
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
    this.data().forEach((item: any) => {
      const key = item.country || 'unknown';
      countries[key] = (countries[key] || 0) + (item.events_count || 0);
    });
    return Object.keys(countries).map(country => ({ country, events_count: countries[country] }));
  }

  // Weighted average percentiles per day for app_start
  getAppStartPercentilesOverTime() {
    const byDay: Record<string, { w: number; p50: number; p90: number; p99: number }> = {};
    this.data()
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
}

interface Filter {
  name: string,
  code: string
}

