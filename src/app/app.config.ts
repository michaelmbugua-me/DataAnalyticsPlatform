import {
  APP_INITIALIZER,
  ApplicationConfig,
  inject,
  provideZoneChangeDetection
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';

import { routes } from './app.routes';
import { DataService } from './core/services/DataService';
import {combineLatest, firstValueFrom, forkJoin, of, timeout} from 'rxjs';
import {catchError} from 'rxjs/operators';

export function preloadDataFactory() {
  return () => {
    const ds = inject(DataService);
    return firstValueFrom(combineLatest([ds.rawData$, ds.dailyRollups$]).pipe(
      timeout(10000),
      catchError(error => {
        console.error('Data loading timeout:', error);
        return of([[], []]);
      })
    ));

  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimations(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(),
    providePrimeNG({
      theme: {
        preset: Aura
      }
    }),
    provideRouter(routes),
    {
      provide: APP_INITIALIZER,
      useFactory: preloadDataFactory,
      multi: true
    }
  ]
};
