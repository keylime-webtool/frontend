import { describe, it, expect, beforeEach } from 'vitest';
import { useVisualizationStore, formatTimestamp } from '../visualizationStore';

beforeEach(() => {
  localStorage.clear();
  useVisualizationStore.setState({
    theme: 'light',
    autoRefresh: true,
    refreshInterval: 30,
    defaultTimeRange: '24h',
    showChartLabels: true,
    tablePageSize: 25,
    timezone: 'UTC',
    timezoneAutoDetect: true,
    dateFormat: 'DD-MM-YYYY',
    timeFormat: '24h',
    integrationsViewMode: 'topology',
  });
});

describe('visualizationStore', () => {
  describe('setters persist to localStorage', () => {
    it('setTheme updates state and saves', () => {
      useVisualizationStore.getState().setTheme('dark');
      expect(useVisualizationStore.getState().theme).toBe('dark');
      const stored = JSON.parse(localStorage.getItem('visualization-settings')!);
      expect(stored.theme).toBe('dark');
    });

    it('setAutoRefresh persists', () => {
      useVisualizationStore.getState().setAutoRefresh(false);
      expect(useVisualizationStore.getState().autoRefresh).toBe(false);
      const stored = JSON.parse(localStorage.getItem('visualization-settings')!);
      expect(stored.autoRefresh).toBe(false);
    });

    it('setRefreshInterval persists', () => {
      useVisualizationStore.getState().setRefreshInterval(60);
      expect(useVisualizationStore.getState().refreshInterval).toBe(60);
    });

    it('setDefaultTimeRange persists', () => {
      useVisualizationStore.getState().setDefaultTimeRange('7d');
      expect(useVisualizationStore.getState().defaultTimeRange).toBe('7d');
    });

    it('setShowChartLabels persists', () => {
      useVisualizationStore.getState().setShowChartLabels(false);
      expect(useVisualizationStore.getState().showChartLabels).toBe(false);
    });

    it('setTablePageSize persists', () => {
      useVisualizationStore.getState().setTablePageSize(50);
      expect(useVisualizationStore.getState().tablePageSize).toBe(50);
    });

    it('setTimezone persists', () => {
      useVisualizationStore.getState().setTimezone('America/New_York');
      expect(useVisualizationStore.getState().timezone).toBe('America/New_York');
    });

    it('setDateFormat persists', () => {
      useVisualizationStore.getState().setDateFormat('YYYY-MM-DD');
      expect(useVisualizationStore.getState().dateFormat).toBe('YYYY-MM-DD');
    });

    it('setTimeFormat persists', () => {
      useVisualizationStore.getState().setTimeFormat('12h');
      expect(useVisualizationStore.getState().timeFormat).toBe('12h');
    });

    it('setIntegrationsViewMode persists', () => {
      useVisualizationStore.getState().setIntegrationsViewMode('list');
      expect(useVisualizationStore.getState().integrationsViewMode).toBe('list');
      const stored = JSON.parse(localStorage.getItem('visualization-settings')!);
      expect(stored.integrationsViewMode).toBe('list');
    });
  });

  describe('setTimezoneAutoDetect', () => {
    it('auto-detects browser timezone when enabled', () => {
      useVisualizationStore.getState().setTimezone('America/Chicago');
      useVisualizationStore.getState().setTimezoneAutoDetect(true);
      const tz = useVisualizationStore.getState().timezone;
      expect(tz).toBe(Intl.DateTimeFormat().resolvedOptions().timeZone);
    });

    it('keeps existing timezone when disabled', () => {
      useVisualizationStore.getState().setTimezone('Europe/London');
      useVisualizationStore.getState().setTimezoneAutoDetect(false);
      expect(useVisualizationStore.getState().timezone).toBe('Europe/London');
    });
  });
});

describe('formatTimestamp', () => {
  const iso = '2025-03-15T14:30:45Z';

  it('returns "--" for null or undefined', () => {
    expect(formatTimestamp(null, 'UTC')).toBe('--');
    expect(formatTimestamp(undefined, 'UTC')).toBe('--');
  });

  it('returns original string for invalid date', () => {
    expect(formatTimestamp('not-a-date', 'UTC')).toBe('not-a-date');
  });

  it('formats with YYYY-MM-DD', () => {
    const result = formatTimestamp(iso, 'UTC', 'YYYY-MM-DD', '24h');
    expect(result).toMatch(/^2025-03-15,/);
  });

  it('formats with DD/MM/YYYY', () => {
    const result = formatTimestamp(iso, 'UTC', 'DD/MM/YYYY', '24h');
    expect(result).toMatch(/^15\/03\/2025,/);
  });

  it('formats with MM/DD/YYYY', () => {
    const result = formatTimestamp(iso, 'UTC', 'MM/DD/YYYY', '24h');
    expect(result).toMatch(/^03\/15\/2025,/);
  });

  it('formats with YYYY/MM/DD', () => {
    const result = formatTimestamp(iso, 'UTC', 'YYYY/MM/DD', '24h');
    expect(result).toMatch(/^2025\/03\/15,/);
  });

  it('formats with DD-MM-YYYY', () => {
    const result = formatTimestamp(iso, 'UTC', 'DD-MM-YYYY', '24h');
    expect(result).toMatch(/^15-03-2025,/);
  });

  it('formats with MM-DD-YYYY', () => {
    const result = formatTimestamp(iso, 'UTC', 'MM-DD-YYYY', '24h');
    expect(result).toMatch(/^03-15-2025,/);
  });

  it('accepts Date object', () => {
    const result = formatTimestamp(new Date(iso), 'UTC', 'YYYY-MM-DD', '24h');
    expect(result).toMatch(/^2025-03-15,/);
  });

  it('accepts numeric timestamp', () => {
    const result = formatTimestamp(new Date(iso).getTime(), 'UTC', 'YYYY-MM-DD', '24h');
    expect(result).toMatch(/^2025-03-15,/);
  });

  it('uses custom Intl options when provided', () => {
    const result = formatTimestamp(iso, 'UTC', undefined, undefined, {
      year: 'numeric',
      month: 'short',
    });
    expect(result).toContain('2025');
    expect(result).toContain('Mar');
  });
});
