import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpClient } from '@angular/common/http';
import { DataService, DateRange } from './DataService';
import { DailyRollup, RawEvent } from '../models/DataModels';

describe('DataService', () => {
  let service: DataService;
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;

  const mockRawEvents: any[] = [
    {
      timestamp: '2024-01-01T10:00:00Z',
      day: '2024-01-01',
      event_type: 'purchase',
      user_id: 'user1',
      amount: 99.99
    },
    {
      timestamp: '2024-01-02T11:00:00Z',
      day: '2024-01-02',
      event_type: 'view',
      user_id: 'user2'
    }
  ];

  const mockDailyRollups: any[] = [
    {
      day: '2024-01-01',
      source: 'organic',
      platform: 'iOS',
      events_count: 100,
      users_count: 50,
      revenue_usd: 999.99
    },
    {
      day: '2024-01-02',
      source: 'paid',
      platform: 'Android',
      events_count: 200,
      users_count: 75,
      revenue_usd: 1499.99
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DataService]
    });

    service = TestBed.inject(DataService);
    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
  });

  afterEach(() => {
    httpMock.verify(); // Verify no outstanding requests
    jest.useRealTimers();
  });

  describe('Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize with default date range', () => {
      const now = new Date();
      const expectedFrom = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

      expect(service.dateRange().from.getMonth()).toBe(expectedFrom.getMonth());
      expect(service.dateRange().from.getFullYear()).toBe(expectedFrom.getFullYear());
      expect(service.dateRange().to.getTime()).toBeCloseTo(now.getTime(), -2); // Allow small time difference
    });

    it('should initialize signals with empty arrays', () => {
      expect(service.data()).toEqual([]);
      expect(service.dailyRollups()).toEqual([]);
    });

    it('should initialize loading as false', () => {
      expect(service.loading()).toBe(false);
    });

    it('should initialize error as null', () => {
      expect(service.error()).toBe(null);
    });
  });

  describe('HTTP Data Loading', () => {
    it('should load raw events data successfully', fakeAsync(() => {
      service.refresh();

      const req = httpMock.expectOne('/data/raw_events.json');
      expect(req.request.method).toBe('GET');
      req.flush(mockRawEvents);

      tick();

      expect(service.data()).toEqual(mockRawEvents);
      expect(service.loading()).toBe(false);
      expect(service.error()).toBe(null);
    }));

    it('should load daily rollups data successfully', fakeAsync(() => {
      service.refresh();

      const req1 = httpMock.expectOne('/data/raw_events.json');
      const req2 = httpMock.expectOne('/data/daily_rollups.json');

      req1.flush(mockRawEvents);
      req2.flush(mockDailyRollups);

      tick();

      expect(service.dailyRollups()).toEqual(mockDailyRollups);
      expect(service.loading()).toBe(false);
      expect(service.error()).toBe(null);
    }));

    it('should handle HTTP errors for raw events', fakeAsync(() => {
      service.refresh();

      const req = httpMock.expectOne('/data/raw_events.json');
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });

      tick();

      expect(service.data()).toEqual([]);
      expect(service.loading()).toBe(false);
      expect(service.error()).toContain('Failed to load data');
      expect(service.error()).toContain('500');
    }));

    it('should handle HTTP errors for daily rollups', fakeAsync(() => {
      service.refresh();

      const req1 = httpMock.expectOne('/data/raw_events.json');
      const req2 = httpMock.expectOne('/data/daily_rollups.json');

      req1.flush(mockRawEvents);
      req2.flush('Not found', { status: 404, statusText: 'Not Found' });

      tick();

      expect(service.dailyRollups()).toEqual([]);
      expect(service.loading()).toBe(false);
      expect(service.error()).toContain('Failed to load daily rollups');
      expect(service.error()).toContain('404');
    }));

    it('should retry failed requests', fakeAsync(() => {
      service.refresh();

      const req = httpMock.expectOne('/data/raw_events.json');
      req.error(new ErrorEvent('Network error'));

      // Should retry based on retryCount (2 retries = 3 total attempts)
      const req2 = httpMock.expectOne('/data/raw_events.json');
      req2.error(new ErrorEvent('Network error'));

      const req3 = httpMock.expectOne('/data/raw_events.json');
      req3.flush(mockRawEvents);

      tick();

      expect(service.data()).toEqual(mockRawEvents);
    }));
  });

  describe('Date Range Management', () => {
    it('should set date range correctly', () => {
      const newRange: DateRange = {
        from: new Date('2024-01-01'),
        to: new Date('2024-01-31')
      };

      service.setDateRange(newRange);

      expect(service.dateRange()).toEqual(newRange);
    });

    it('should reset to default month range', () => {
      const customRange: DateRange = {
        from: new Date('2023-01-01'),
        to: new Date('2023-12-31')
      };

      service.setDateRange(customRange);
      service.resetToThisMonth();

      const now = new Date();
      const expectedFrom = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

      expect(service.dateRange().from.getMonth()).toBe(expectedFrom.getMonth());
      expect(service.dateRange().from.getFullYear()).toBe(expectedFrom.getFullYear());
    });
  });

  describe('Date Filtering Utilities', () => {
    it('should get date from RawEvent with timestamp', () => {
      const event: RawEvent = {
        timestamp: '2024-01-01T10:00:00Z',
        day: '2024-01-02' // Should prefer timestamp
      } as RawEvent;

      const result = (service as any).getRawEventDate(event);
      expect(result?.toISOString()).toContain('2024-01-01');
    });

    it('should get date from RawEvent with day only', () => {
      const event: RawEvent = {
        day: '2024-01-01'
      } as RawEvent;

      const result = (service as any).getRawEventDate(event);
      expect(result?.toISOString()).toContain('2024-01-01');
    });

    it('should return null for RawEvent with invalid date', () => {
      const event: RawEvent = {
        day: 'invalid-date'
      } as RawEvent;

      const result = (service as any).getRawEventDate(event);
      expect(result).toBeNull();
    });

    it('should get date from DailyRollup', () => {
      const rollup: DailyRollup = {
        day: '2024-01-01'
      } as DailyRollup;

      const result = (service as any).getRollupDate(rollup);
      expect(result?.toISOString()).toContain('2024-01-01');
    });

    it('should return null for DailyRollup with invalid date', () => {
      const rollup: DailyRollup = {
        day: 'invalid-date'
      } as DailyRollup;

      const result = (service as any).getRollupDate(rollup);
      expect(result).toBeNull();
    });

    it('should check if date is in range', () => {
      const range: DateRange = {
        from: new Date('2024-01-01'),
        to: new Date('2024-01-31')
      };

      const dateInRange = new Date('2024-01-15');
      const dateBefore = new Date('2023-12-31');
      const dateAfter = new Date('2024-02-01');

      expect((service as any).inRange(dateInRange, range)).toBe(true);
      expect((service as any).inRange(dateBefore, range)).toBe(false);
      expect((service as any).inRange(dateAfter, range)).toBe(false);
    });
  });

  describe('Filtered Data Signals', () => {
    beforeEach(fakeAsync(() => {
      // Load data first
      service.refresh();

      const req1 = httpMock.expectOne('/data/raw_events.json');
      const req2 = httpMock.expectOne('/data/daily_rollups.json');

      req1.flush(mockRawEvents);
      req2.flush(mockDailyRollups);

      tick();
    }));

    it('should filter raw events by date range', () => {
      const range: DateRange = {
        from: new Date('2024-01-01'),
        to: new Date('2024-01-01')
      };

      service.setDateRange(range);

      const filtered = service.filteredRawData();
      expect(filtered.length).toBe(1);
      expect(filtered[0].timestamp).toContain('2024-01-01');
    });

    it('should filter daily rollups by date range', () => {
      const range: DateRange = {
        from: new Date('2024-01-02'),
        to: new Date('2024-01-02')
      };

      service.setDateRange(range);

      const filtered = service.filteredDailyRollups();
      expect(filtered.length).toBe(1);
      expect(filtered[0].day).toBe('2024-01-02');
    });

    it('should return empty array when no data matches range', () => {
      const range: DateRange = {
        from: new Date('2023-01-01'),
        to: new Date('2023-12-31')
      };

      service.setDateRange(range);

      expect(service.filteredRawData()).toEqual([]);
      expect(service.filteredDailyRollups()).toEqual([]);
    });

    it('should handle records with invalid dates in filtering', fakeAsync(() => {
      const eventsWithInvalidDate = [
        ...mockRawEvents,
        { day: 'invalid-date' } as RawEvent
      ];

      service.refresh();
      const req = httpMock.expectOne('/data/raw_events.json');
      req.flush(eventsWithInvalidDate);
      tick();

      // Should filter out the invalid date record
      expect(service.filteredRawData().length).toBe(2); // Only the valid ones
    }));
  });

  describe('Error Handling', () => {
    it('should handle network errors', fakeAsync(() => {
      service.refresh();

      const req = httpMock.expectOne('/data/raw_events.json');
      req.error(new ErrorEvent('Network error'));

      tick();

      expect(service.error()).toContain('Network error');
      expect(service.data()).toEqual([]);
    }));

    it('should handle empty responses', fakeAsync(() => {
      service.refresh();

      const req1 = httpMock.expectOne('/data/raw_events.json');
      const req2 = httpMock.expectOne('/data/daily_rollups.json');

      req1.flush([]);
      req2.flush([]);

      tick();

      expect(service.data()).toEqual([]);
      expect(service.dailyRollups()).toEqual([]);
      expect(service.error()).toBe(null);
    }));
  });

  describe('Refresh Mechanism', () => {
    it('should reload data when refresh() is called', fakeAsync(() => {
      service.refresh();

      // First load
      const req1 = httpMock.expectOne('/data/raw_events.json');
      const req2 = httpMock.expectOne('/data/daily_rollups.json');

      req1.flush(mockRawEvents);
      req2.flush(mockDailyRollups);

      tick();

      // Refresh again
      service.refresh();

      // Second load
      const req3 = httpMock.expectOne('/data/raw_events.json');
      const req4 = httpMock.expectOne('/data/daily_rollups.json');

      req3.flush([]); // Empty response this time
      req4.flush([]);

      tick();

      expect(service.data()).toEqual([]);
      expect(service.dailyRollups()).toEqual([]);
    }));

    it('should set loading state during refresh', fakeAsync(() => {
      expect(service.loading()).toBe(false);

      service.refresh();
      expect(service.loading()).toBe(true);

      const req1 = httpMock.expectOne('/data/raw_events.json');
      const req2 = httpMock.expectOne('/data/daily_rollups.json');

      req1.flush(mockRawEvents);
      req2.flush(mockDailyRollups);

      tick();

      expect(service.loading()).toBe(false);
    }));
  });

  describe('getDefaultMonthRange Utility', () => {
    it('should create range for current month', () => {
      const now = new Date('2024-01-15');
      const range = getDefaultMonthRange(now);

      expect(range.from).toEqual(new Date(2024, 0, 1, 0, 0, 0, 0));
      expect(range.to).toEqual(now);
    });

    it('should handle different months correctly', () => {
      const december = new Date('2024-12-15');
      const range = getDefaultMonthRange(december);

      expect(range.from).toEqual(new Date(2024, 11, 1, 0, 0, 0, 0));
      expect(range.to).toEqual(december);
    });
  });
});

// Export the utility function for testing
export function getDefaultMonthRange(now = new Date()): DateRange {
  return {
    from: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0),
    to: now,
  };
}
