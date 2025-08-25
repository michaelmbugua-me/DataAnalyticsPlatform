
import {computed, Injectable, Signal, signal} from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, finalize, retry, shareReplay, switchMap, tap } from 'rxjs/operators';
import { DailyRollup, RawEvent } from '../models/DataModels';

@Injectable({ providedIn: 'root' })
export class DataService {

  public rawData$: Observable<RawEvent[]>;
  public data: Signal<RawEvent[]>;

  public dailyRollups$: Observable<DailyRollup[]>;
  public dailyRollups: Signal<DailyRollup[]>;

  public readonly loading = signal<boolean>(false);
  public readonly error = signal<string | null>(null);

  private readonly sourceUrl = '/data/raw_events.json';
  private readonly dailyRollupsUrl = '/data/daily_rollups.json';
  private readonly retryCount = 2;

  // Global date range (defaults to this month)
  readonly dateRange = signal<DateRange>(getDefaultMonthRange());

  setDateRange(r: DateRange) { this.dateRange.set(r); }

  resetToThisMonth() { this.dateRange.set(getDefaultMonthRange()); }

  private inRange(d: Date, r: DateRange) {
    return d >= r.from && d <= r.to;
  }

  private getRawEventDate(rec: RawEvent): Date | null {
    // Prefer numeric/ISO timestamp
    if (rec?.timestamp != null) {
      const t = new Date(rec.timestamp);
      if (!isNaN(t.getTime())) return t;
    }
    // Fallback: a day string like '2025-08-05'
    if (rec?.day) {
      const t = new Date(rec.day);
      if (!isNaN(t.getTime())) return t;
    }
    return null;
  }

  private getRollupDate(rec: DailyRollup): Date | null {
    if (!rec?.day) return null;
    const t = new Date(rec.day);
    return isNaN(t.getTime()) ? null : t;
  }

  // Derived, filtered signals
  readonly filteredRawData = computed<RawEvent[]>(() => {
    const r = this.dateRange();
    const arr = this.data();
    return arr.filter(rec => {
      const d = this.getRawEventDate(rec);
      return d ? this.inRange(d, r) : false;
    });
  });

  readonly filteredDailyRollups = computed<DailyRollup[]>(() => {
    const r = this.dateRange();
    const arr = this.dailyRollups();
    return arr.filter(rec => {
      const d = this.getRollupDate(rec);
      return d ? this.inRange(d, r) : false;
    });
  });


  private readonly reload$ = new BehaviorSubject<void>(undefined);

  constructor(private http: HttpClient) {
    this.rawData$ = this.reload$.pipe(
      switchMap(() => {
        this.loading.set(true);
        this.error.set(null);
        return this.http.get<RawEvent[]>(this.sourceUrl).pipe(
          retry(this.retryCount),
          tap(() => {

          }),
          catchError((err: HttpErrorResponse) => {
            const status = err?.status ?? 'unknown';
            const reason = err?.message || 'Unknown error';
            const msg = `Failed to load data (${status}): ${reason}`;

            console.error('[DataService]', msg, err);
            this.error.set(msg);
            return of([] as RawEvent[]);
          }),
          finalize(() => this.loading.set(false))
        );
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    // Daily rollups observable, shares the latest value
    this.dailyRollups$ = this.reload$.pipe(
      switchMap(() => {
        this.loading.set(true);
        this.error.set(null);
        return this.http.get<DailyRollup[]>(this.dailyRollupsUrl).pipe(
          retry(this.retryCount),
          catchError((err: HttpErrorResponse) => {
            const status = err?.status ?? 'unknown';
            const reason = err?.message || 'Unknown error';
            const msg = `Failed to load daily rollups (${status}): ${reason}`;
            console.error('[DataService]', msg, err);
            this.error.set(msg);
            return of([] as DailyRollup[]);
          }),
          finalize(() => this.loading.set(false))
        );
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    // Signals for template consumption
    this.data = toSignal(this.rawData$, { initialValue: [] as RawEvent[] });
    this.dailyRollups = toSignal(this.dailyRollups$, { initialValue: [] as DailyRollup[] });
  }

  refresh(): void {
    this.reload$.next();
  }
}


export interface DateRange {
  from: Date;
  to: Date;
}

function getDefaultMonthRange(now = new Date()): DateRange {
  return {
    from: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0),
    to: now,
  };
}
