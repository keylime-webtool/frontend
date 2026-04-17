import { useCallback } from 'react';
import { create } from 'zustand';

export type Theme = 'light' | 'dark';

interface VisualizationState {
  theme: Theme;
  autoRefresh: boolean;
  refreshInterval: number;
  defaultTimeRange: string;
  showChartLabels: boolean;
  tablePageSize: number;
  timezone: string;
  timezoneAutoDetect: boolean;
  setTheme: (theme: Theme) => void;
  setAutoRefresh: (enabled: boolean) => void;
  setRefreshInterval: (seconds: number) => void;
  setDefaultTimeRange: (range: string) => void;
  setShowChartLabels: (show: boolean) => void;
  setTablePageSize: (size: number) => void;
  setTimezone: (tz: string) => void;
  setTimezoneAutoDetect: (auto: boolean) => void;
}

const STORAGE_KEY = 'visualization-settings';

function loadSettings(): Partial<VisualizationState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveSettings(state: Partial<VisualizationState>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    theme: state.theme,
    autoRefresh: state.autoRefresh,
    refreshInterval: state.refreshInterval,
    defaultTimeRange: state.defaultTimeRange,
    showChartLabels: state.showChartLabels,
    tablePageSize: state.tablePageSize,
    timezone: state.timezone,
    timezoneAutoDetect: state.timezoneAutoDetect,
  }));
}

function getBrowserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

const saved = loadSettings();
const initialTheme = (saved.theme as Theme) ?? 'light';
applyTheme(initialTheme);

const initialAutoDetect = saved.timezoneAutoDetect ?? true;
const initialTimezone = initialAutoDetect ? getBrowserTimezone() : (saved.timezone ?? getBrowserTimezone());

export const useVisualizationStore = create<VisualizationState>((set) => ({
  theme: initialTheme,
  autoRefresh: saved.autoRefresh ?? true,
  refreshInterval: saved.refreshInterval ?? 30,
  defaultTimeRange: saved.defaultTimeRange ?? '24h',
  showChartLabels: saved.showChartLabels ?? true,
  tablePageSize: saved.tablePageSize ?? 25,
  timezone: initialTimezone,
  timezoneAutoDetect: initialAutoDetect,
  setTheme: (theme) => {
    applyTheme(theme);
    set((s) => { const next = { ...s, theme }; saveSettings(next); return { theme }; });
  },
  setAutoRefresh: (autoRefresh) =>
    set((s) => { const next = { ...s, autoRefresh }; saveSettings(next); return { autoRefresh }; }),
  setRefreshInterval: (refreshInterval) =>
    set((s) => { const next = { ...s, refreshInterval }; saveSettings(next); return { refreshInterval }; }),
  setDefaultTimeRange: (defaultTimeRange) =>
    set((s) => { const next = { ...s, defaultTimeRange }; saveSettings(next); return { defaultTimeRange }; }),
  setShowChartLabels: (showChartLabels) =>
    set((s) => { const next = { ...s, showChartLabels }; saveSettings(next); return { showChartLabels }; }),
  setTablePageSize: (tablePageSize) =>
    set((s) => { const next = { ...s, tablePageSize }; saveSettings(next); return { tablePageSize }; }),
  setTimezone: (timezone) =>
    set((s) => { const next = { ...s, timezone }; saveSettings(next); return { timezone }; }),
  setTimezoneAutoDetect: (timezoneAutoDetect) =>
    set((s) => {
      const timezone = timezoneAutoDetect ? getBrowserTimezone() : s.timezone;
      const next = { ...s, timezoneAutoDetect, timezone };
      saveSettings(next);
      return { timezoneAutoDetect, timezone };
    }),
}));

/**
 * Format a timestamp string or Date using the configured timezone.
 * Returns a locale-formatted string with date and time.
 */
export function formatTimestamp(
  value: string | number | Date | null | undefined,
  timezone: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  if (value == null) return '--';
  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return String(value);
  return date.toLocaleString(undefined, { timeZone: timezone, ...options });
}

/**
 * Hook that returns a formatter bound to the current timezone setting.
 */
export function useFormatTimestamp() {
  const timezone = useVisualizationStore((s) => s.timezone);
  return useCallback(
    (value: string | number | Date | null | undefined, options?: Intl.DateTimeFormatOptions) =>
      formatTimestamp(value, timezone, options),
    [timezone],
  );
}
