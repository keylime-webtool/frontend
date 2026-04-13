import { create } from 'zustand';

export type Theme = 'light' | 'dark';

interface VisualizationState {
  theme: Theme;
  autoRefresh: boolean;
  refreshInterval: number;
  defaultTimeRange: string;
  showChartLabels: boolean;
  tablePageSize: number;
  setTheme: (theme: Theme) => void;
  setAutoRefresh: (enabled: boolean) => void;
  setRefreshInterval: (seconds: number) => void;
  setDefaultTimeRange: (range: string) => void;
  setShowChartLabels: (show: boolean) => void;
  setTablePageSize: (size: number) => void;
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
  }));
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

const saved = loadSettings();
const initialTheme = (saved.theme as Theme) ?? 'light';
applyTheme(initialTheme);

export const useVisualizationStore = create<VisualizationState>((set) => ({
  theme: initialTheme,
  autoRefresh: saved.autoRefresh ?? true,
  refreshInterval: saved.refreshInterval ?? 30,
  defaultTimeRange: saved.defaultTimeRange ?? '24h',
  showChartLabels: saved.showChartLabels ?? true,
  tablePageSize: saved.tablePageSize ?? 25,
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
}));
