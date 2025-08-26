import { EventSource, ReleaseChannel } from '../../../core/models/DataModels';

export function getSourceCellStyle(source: EventSource): Record<string, string> {
  const styles = {
    analytics: { backgroundColor: '#e3f2fd', color: '#1976d2' },
    performance: { backgroundColor: '#f3e5f5', color: '#7b1fa2' },
    crash: { backgroundColor: '#ffebee', color: '#d32f2f' }
  } as const;
  return (styles as Record<string, Record<string, string>>)[source] || {};
}

export function getReleaseChannelStyle(channel: ReleaseChannel): Record<string, string> {
  const styles = {
    prod: { backgroundColor: '#4caf50', color: 'white', fontWeight: 'bold' },
    pilot: { backgroundColor: '#ff9800', color: 'white' },
    uat: { backgroundColor: '#2196f3', color: 'white' },
    dev: { backgroundColor: '#9e9e9e', color: 'white' }
  } as const;
  return (styles as Record<string, Record<string, string>>)[channel] || {};
}

export function getDurationCellStyle(duration?: number): Record<string, string> {
  if (!duration) return {};
  if (duration > 2000) return { backgroundColor: '#ffebee', color: '#d32f2f' };
  if (duration > 1000) return { backgroundColor: '#fff3e0', color: '#f57c00' };
  return { backgroundColor: '#e8f5e8', color: '#2e7d32' };
}
