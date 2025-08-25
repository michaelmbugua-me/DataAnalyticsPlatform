
import { Injectable, Signal, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, finalize, retry, shareReplay, switchMap, tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class DataService {

  public rawData$: Observable<any[]>;
  public data: Signal<any[]>;

  public dailyRollups$: Observable<any[]>;
  public dailyRollups: Signal<any[]>;

  public readonly loading = signal<boolean>(false);
  public readonly error = signal<string | null>(null);

  private readonly sourceUrl = '/data/raw_events.json';
  private readonly dailyRollupsUrl = '/data/daily_rollups.json';
  private readonly retryCount = 2;

  private readonly reload$ = new BehaviorSubject<void>(undefined);

  constructor(private http: HttpClient) {
    this.rawData$ = this.reload$.pipe(
      switchMap(() => {
        this.loading.set(true);
        this.error.set(null);
        return this.http.get<any[]>(this.sourceUrl).pipe(
          retry(this.retryCount),
          tap(() => {

          }),
          catchError((err: HttpErrorResponse) => {
            const status = err?.status ?? 'unknown';
            const reason = err?.message || 'Unknown error';
            const msg = `Failed to load data (${status}): ${reason}`;

            console.error('[DataService]', msg, err);
            this.error.set(msg);
            return of([] as any[]);
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
        return this.http.get<any[]>(this.dailyRollupsUrl).pipe(
          retry(this.retryCount),
          catchError((err: HttpErrorResponse) => {
            const status = err?.status ?? 'unknown';
            const reason = err?.message || 'Unknown error';
            const msg = `Failed to load daily rollups (${status}): ${reason}`;
            console.error('[DataService]', msg, err);
            this.error.set(msg);
            return of([] as any[]);
          }),
          finalize(() => this.loading.set(false))
        );
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    // Signals for template consumption
    this.data = toSignal(this.rawData$, { initialValue: [] });
    this.dailyRollups = toSignal(this.dailyRollups$, { initialValue: [] });
  }

  refresh(): void {
    this.reload$.next();
  }
}
