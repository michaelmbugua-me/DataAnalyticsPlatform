import { APP_INITIALIZER, inject } from '@angular/core';
import { of, throwError } from 'rxjs';

// We import the module under test AFTER setting up jest mocks for @angular/core.inject
jest.mock('@angular/core', () => {
  // Pull in the real module to keep all other exports intact
  const real = jest.requireActual('@angular/core');
  return {
    ...real,
    inject: jest.fn(),
  } as typeof import('@angular/core');
});

// Now import the code under test
import { appConfig, preloadDataFactory } from './app.config';

// Types helper (no runtime import)
interface MockDataService {
  rawData$: any;
  dailyRollups$: any;
}

const mockedInject = inject as unknown as jest.Mock;

describe('app.config', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('preloadDataFactory', () => {
    it('should resolve when DataService emits combined data', async () => {
      const ds: MockDataService = {
        rawData$: of([{ id: 1 }]),
        dailyRollups$: of([{ day: '2025-08-28' }]),
      };
      mockedInject.mockReturnValue(ds);

      const factory = preloadDataFactory();
      const result = await factory();

      expect(mockedInject).toHaveBeenCalled();
      // Expect the combined latest tuple (array of 2 arrays)
      expect(result).toEqual([[{ id: 1 }], [{ day: '2025-08-28' }]]);
    });

    it('should return empty arrays if the combined stream errors and log the error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const ds: MockDataService = {
        rawData$: throwError(() => new Error('boom')),
        dailyRollups$: of([{ day: '2025-08-28' }]),
      };
      mockedInject.mockReturnValue(ds);

      const factory = preloadDataFactory();
      const result = await factory();

      expect(result).toEqual([[], []]);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('appConfig', () => {
    it('should export an ApplicationConfig-like object with providers', () => {
      expect(appConfig).toBeDefined();
      expect(Array.isArray((appConfig as any).providers)).toBe(true);
      expect((appConfig as any).providers.length).toBeGreaterThan(0);
    });

    it('should include APP_INITIALIZER using preloadDataFactory and multi:true', () => {
      const providers: any[] = (appConfig as any).providers;
      const initProvider = providers.find(p => p && p.provide === APP_INITIALIZER);

      expect(initProvider).toBeDefined();
      expect(initProvider.useFactory).toBe(preloadDataFactory);
      expect(initProvider.multi).toBe(true);
    });
  });
});
