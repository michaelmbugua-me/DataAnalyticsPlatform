// Central data models for Raw Events and Daily Rollups
// Based on the provided schema in issue description

// Common string literal unions
export type EventSource = 'analytics' | 'performance' | 'crash';
export type Platform = 'ios' | 'android' | 'web';
export type AppId = 'eabank_main' | 'bancaire_drc' | 'eabank_branch';
export type ReleaseChannel = 'dev' | 'uat' | 'pilot' | 'prod';
export type Country = 'KE' | 'UG' | 'TZ' | 'RW' | 'DRC' | 'SS';
export type DeviceTier = 'low' | 'mid' | 'high';
export type Locale = 'EN' | 'SW' | 'RW' | 'FR' | 'ZH';
export type NetworkType = 'wifi' | 'cellular' | 'offline';

// Base fields for all raw events
export interface RawEventBase {
  id: string;
  timestamp: string; // ISO 8601 UTC
  day: string; // YYYY-MM-DD
  hour: number; // 0-23
  source: EventSource;
  event_name: string;
  session_id: string;
  user_pseudo_id: string;
  count: number; // always 1 in dataset

  // Application context
  app_id: AppId;
  app_name?: string;
  platform: Platform;
  release_channel: ReleaseChannel;
  app_version: string;
  build_number?: string;
  os_version?: string;

  // Device & Location
  device_model?: string;
  device_tier?: DeviceTier;
  country: Country;
  locale?: Locale;
  network_type?: NetworkType;
  carrier?: string | null; // only when network_type = 'cellular'

  // Some datasets include these flags even for non-crash events
  is_crash?: 0 | 1;
  is_fatal?: 0 | 1;

  // Optional revenue placeholders seen in example data
  revenue_usd?: number;
  purchase_count?: number;
}

// Analytics Events
export interface AnalyticsEvent extends RawEventBase {
  source: 'analytics';
  // Specific analytics fields
  analytics_event: string; // mirrors specific event type
  screen?: string;

  // Business context (conditional)
  value_num?: number;
  currency?: 'KES' | 'UGX' | 'TZS' | 'USD';
  transaction_type?: string; // e.g., 'domestic_transfer', 'bill_payment'
  account_type?: string; // e.g., 'savings', 'current'
  branch_code?: string; // e.g., 'KE_CBD_042'
}

// Performance Events
export type PerfType = 'http' | 'trace' | 'screen' | 'app_start';

export interface PerformanceEventBase extends RawEventBase {
  source: 'performance';
  perf_type: PerfType;
  duration_ms?: number; // present for most performance events
}

export interface HttpPerformanceEvent extends PerformanceEventBase {
  perf_type: 'http';
  event_name: 'api_call' | string; // keeping flexible but default is 'api_call'
  http_method: 'GET' | 'POST' | 'PUT';
  url_path: string;
  status_code: number;
  success: boolean;
  ttfb_ms?: number;
  payload_bytes?: number;
  screen?: string;
}

export interface ScreenPerformanceEvent extends PerformanceEventBase {
  perf_type: 'screen';
  event_name: 'screen' | string;
  screen: string;
  fps_avg?: number;
}

export interface TracePerformanceEvent extends PerformanceEventBase {
  perf_type: 'trace';
  event_name: 'trace' | string;
  trace_name: string;
  cpu_ms?: number;
  memory_mb?: number;
}

export interface AppStartPerformanceEvent extends PerformanceEventBase {
  perf_type: 'app_start';
  event_name: 'app_start';
  duration_ms: number; // required for app start
}

export type PerformanceEvent =
  | HttpPerformanceEvent
  | ScreenPerformanceEvent
  | TracePerformanceEvent
  | AppStartPerformanceEvent;

// Crash Events
export interface CrashEvent extends RawEventBase {
  source: 'crash';
  event_name: 'crash' | string;
  is_crash: 1;
  is_fatal: 0 | 1;
  crash_type: 'fatal' | 'nonfatal' | 'anr';
  exception_type?: string;
  crash_group_id?: string;
  foreground?: boolean;
}

// Discriminated union for any raw event
export type RawEvent = AnalyticsEvent | PerformanceEvent | CrashEvent;

// Daily Rollups
export interface DailyRollupDimensions {
  day: string;
  source: EventSource;
  platform: Platform;
  app_id: AppId;
  app_version: string;
  release_channel: ReleaseChannel;
  country: Country;
  device_tier: DeviceTier;
  event_group: string; // e.g., 'performance:api_call', 'analytics:login_success', 'crash:fatal'
}

export interface DailyRollupAggregates {
  events_count: number;
  users_count: number;
  sessions_count: number;

  // Performance-only duration stats (optional otherwise)
  avg_duration_ms?: number;
  p50_duration_ms?: number;
  p90_duration_ms?: number;
  p99_duration_ms?: number;

  // Error rates (conditional)
  http_error_rate?: number; // for performance:api_call
  crash_rate_per_1k_sessions?: number; // for crash groupings

  // Revenue placeholders
  revenue_usd: number;
  purchase_count: number;
}

export type DailyRollup = DailyRollupDimensions & DailyRollupAggregates;
