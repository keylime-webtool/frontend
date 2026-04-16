import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useVisualizationStore } from '@/store/visualizationStore';
import { settingsApi } from '@/api/settings';
import { getBackendUrl, setBackendUrl } from '@/api/client';
import type { KeylimeSettings } from '@/api/settings';
import { TIME_RANGES } from '@/types';

const COMPLIANCE_FRAMEWORKS = [
  'NIST SP 800-155/193',
  'PCI DSS 4.0',
  'SOC 2 Type II',
  'FedRAMP',
  'CIS Controls v8',
];

const REFRESH_INTERVALS = [10, 15, 30, 60, 120];
const PAGE_SIZES = [10, 25, 50, 100];

const settingRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '14px 0',
  borderBottom: '1px solid var(--color-border)',
};

const settingLabelStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 500,
};

const settingDescStyle: React.CSSProperties = {
  fontSize: '12px',
  color: 'var(--color-text-secondary)',
  marginTop: '2px',
};

const selectStyle: React.CSSProperties = {
  padding: '6px 12px',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-sm)',
  fontSize: '14px',
  background: 'var(--color-surface)',
  color: 'var(--color-text)',
};

export function Settings() {
  const { user, isAdmin } = useAuth();
  const [activeSection, setActiveSection] = useState('keylime');
  const viz = useVisualizationStore();
  const queryClient = useQueryClient();

  const { data: keylimeSettings } = useQuery({
    queryKey: ['settings', 'keylime'],
    queryFn: () => settingsApi.getKeylime(),
    select: (res) => res.data as unknown as KeylimeSettings,
  });

  const [verifierUrl, setVerifierUrl] = useState('');
  const [registrarUrl, setRegistrarUrl] = useState('');
  const [formLoaded, setFormLoaded] = useState(false);

  // Populate form fields once settings are loaded
  if (keylimeSettings && !formLoaded) {
    setVerifierUrl(keylimeSettings.verifier_url);
    setRegistrarUrl(keylimeSettings.registrar_url);
    setFormLoaded(true);
  }

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const updateMutation = useMutation({
    mutationFn: (settings: KeylimeSettings) => settingsApi.updateKeylime(settings),
    onMutate: () => setSaveStatus('saving'),
    onSuccess: () => {
      setSaveStatus('saved');
      queryClient.invalidateQueries({ queryKey: ['settings', 'keylime'] });
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      setTimeout(() => setSaveStatus('idle'), 3000);
    },
    onError: () => {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    },
  });

  const handleSaveKeylime = (_field?: string) => {
    updateMutation.mutate({
      verifier_url: verifierUrl.trim(),
      registrar_url: registrarUrl.trim(),
    });
  };

  const [backendUrlInitial] = useState(() => getBackendUrl());
  const [backendUrlField, setBackendUrlField] = useState(backendUrlInitial);

  const handleSaveBackendUrl = () => {
    setBackendUrl(backendUrlField);
    queryClient.invalidateQueries();
    window.location.reload();
  };

  const sections = [
    { key: 'keylime', label: 'Keylime Connection' },
    { key: 'visualization', label: 'Visualization' },
    { key: 'compliance', label: 'Compliance Reports' },
    { key: 'alerts', label: 'Alert Thresholds' },
    { key: 'integrations', label: 'External Integrations' },
    { key: 'general', label: 'General Settings' },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title">Settings</h1>
        <p className="page-header__subtitle">Configuration, compliance reports, and system preferences</p>
      </div>

      <div style={{ display: 'flex', gap: '24px' }}>
        <div style={{ width: '200px', flexShrink: 0 }}>
          <nav aria-label="Settings sections">
            {sections.map((sec) => (
              <button
                key={sec.key}
                onClick={() => setActiveSection(sec.key)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 16px',
                  border: 'none',
                  background: activeSection === sec.key ? 'var(--color-bg)' : 'transparent',
                  color: activeSection === sec.key ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  fontWeight: activeSection === sec.key ? 600 : 400,
                  fontSize: '14px',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '4px',
                }}
              >
                {sec.label}
              </button>
            ))}
          </nav>
        </div>

        <div style={{ flex: 1 }}>
          {activeSection === 'keylime' && (
            <div className="section">
              <h2 className="section__title">Keylime Connection</h2>
              <div>
                <div style={settingRowStyle}>
                  <div style={{ flex: 1 }}>
                    <div style={settingLabelStyle}>Backend URL</div>
                    <div style={settingDescStyle}>Base URL of the Keylime Webtool Backend API</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={backendUrlField}
                      onChange={(e) => setBackendUrlField(e.target.value)}
                      placeholder="http://localhost:8080"
                      style={{ ...selectStyle, width: '260px' }}
                      aria-label="Backend URL"
                    />
                    <button
                      onClick={handleSaveBackendUrl}
                      disabled={backendUrlField === backendUrlInitial}
                      style={{
                        padding: '6px 16px',
                        fontSize: '13px',
                        fontWeight: 500,
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        background: backendUrlField !== backendUrlInitial ? 'var(--color-primary)' : 'var(--color-border)',
                        color: backendUrlField !== backendUrlInitial ? 'white' : 'var(--color-text-secondary)',
                        cursor: backendUrlField !== backendUrlInitial ? 'pointer' : 'default',
                      }}
                    >
                      Apply
                    </button>
                  </div>
                </div>

                <div style={settingRowStyle}>
                  <div style={{ flex: 1 }}>
                    <div style={settingLabelStyle}>Verifier URL</div>
                    <div style={settingDescStyle}>Base URL of the Keylime Verifier API</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={verifierUrl}
                      onChange={(e) => setVerifierUrl(e.target.value)}
                      placeholder="http://localhost:8881"
                      style={{ ...selectStyle, width: '260px' }}
                      aria-label="Verifier URL"
                    />
                    <button
                      onClick={() => handleSaveKeylime('verifier')}
                      disabled={!formLoaded || verifierUrl === keylimeSettings?.verifier_url || saveStatus === 'saving'}
                      style={{
                        padding: '6px 16px',
                        fontSize: '13px',
                        fontWeight: 500,
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        background: formLoaded && verifierUrl !== keylimeSettings?.verifier_url ? 'var(--color-primary)' : 'var(--color-border)',
                        color: formLoaded && verifierUrl !== keylimeSettings?.verifier_url ? 'white' : 'var(--color-text-secondary)',
                        cursor: formLoaded && verifierUrl !== keylimeSettings?.verifier_url ? 'pointer' : 'default',
                      }}
                    >
                      Apply
                    </button>
                  </div>
                </div>

                <div style={{ ...settingRowStyle, borderBottom: 'none' }}>
                  <div style={{ flex: 1 }}>
                    <div style={settingLabelStyle}>Registrar URL</div>
                    <div style={settingDescStyle}>Base URL of the Keylime Registrar API</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={registrarUrl}
                      onChange={(e) => setRegistrarUrl(e.target.value)}
                      placeholder="http://localhost:8890"
                      style={{ ...selectStyle, width: '260px' }}
                      aria-label="Registrar URL"
                    />
                    <button
                      onClick={() => handleSaveKeylime('registrar')}
                      disabled={!formLoaded || registrarUrl === keylimeSettings?.registrar_url || saveStatus === 'saving'}
                      style={{
                        padding: '6px 16px',
                        fontSize: '13px',
                        fontWeight: 500,
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        background: formLoaded && registrarUrl !== keylimeSettings?.registrar_url ? 'var(--color-primary)' : 'var(--color-border)',
                        color: formLoaded && registrarUrl !== keylimeSettings?.registrar_url ? 'white' : 'var(--color-text-secondary)',
                        cursor: formLoaded && registrarUrl !== keylimeSettings?.registrar_url ? 'pointer' : 'default',
                      }}
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'visualization' && (
            <div className="section">
              <h2 className="section__title">Visualization Settings</h2>
              <div>
                <div style={settingRowStyle}>
                  <div>
                    <div style={settingLabelStyle}>Theme</div>
                    <div style={settingDescStyle}>Switch between light and dark appearance</div>
                  </div>
                  <select
                    value={viz.theme}
                    onChange={(e) => viz.setTheme(e.target.value as 'light' | 'dark')}
                    style={selectStyle}
                    aria-label="Theme"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </div>

                <div style={settingRowStyle}>
                  <div>
                    <div style={settingLabelStyle}>Auto-refresh</div>
                    <div style={settingDescStyle}>Automatically refresh dashboard data</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={viz.autoRefresh}
                    onChange={(e) => viz.setAutoRefresh(e.target.checked)}
                    aria-label="Auto-refresh toggle"
                    style={{ width: 18, height: 18 }}
                  />
                </div>

                <div style={settingRowStyle}>
                  <div>
                    <div style={settingLabelStyle}>Refresh interval</div>
                    <div style={settingDescStyle}>Seconds between data refreshes</div>
                  </div>
                  <select
                    value={viz.refreshInterval}
                    onChange={(e) => viz.setRefreshInterval(Number(e.target.value))}
                    style={selectStyle}
                    aria-label="Refresh interval"
                  >
                    {REFRESH_INTERVALS.map((s) => (
                      <option key={s} value={s}>{s}s</option>
                    ))}
                  </select>
                </div>

                <div style={settingRowStyle}>
                  <div>
                    <div style={settingLabelStyle}>Default time range</div>
                    <div style={settingDescStyle}>Initial time window when loading the dashboard</div>
                  </div>
                  <select
                    value={viz.defaultTimeRange}
                    onChange={(e) => viz.setDefaultTimeRange(e.target.value)}
                    style={selectStyle}
                    aria-label="Default time range"
                  >
                    {TIME_RANGES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>

                <div style={settingRowStyle}>
                  <div>
                    <div style={settingLabelStyle}>Chart labels</div>
                    <div style={settingDescStyle}>Show text labels on pie chart slices</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={viz.showChartLabels}
                    onChange={(e) => viz.setShowChartLabels(e.target.checked)}
                    aria-label="Show chart labels"
                    style={{ width: 18, height: 18 }}
                  />
                </div>

                <div style={{ ...settingRowStyle, borderBottom: 'none' }}>
                  <div>
                    <div style={settingLabelStyle}>Table page size</div>
                    <div style={settingDescStyle}>Default number of rows per table page</div>
                  </div>
                  <select
                    value={viz.tablePageSize}
                    onChange={(e) => viz.setTablePageSize(Number(e.target.value))}
                    style={selectStyle}
                    aria-label="Table page size"
                  >
                    {PAGE_SIZES.map((n) => (
                      <option key={n} value={n}>{n} rows</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'compliance' && (
            <div className="section">
              <h2 className="section__title">Compliance Framework Reports</h2>
              <div style={{ display: 'grid', gap: '12px' }}>
                {COMPLIANCE_FRAMEWORKS.map((fw) => (
                  <div
                    key={fw}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <span style={{ fontWeight: 500 }}>{fw}</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        style={{
                          padding: '4px 12px',
                          fontSize: '12px',
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--color-surface)',
                          color: 'var(--color-text)',
                        }}
                      >
                        View Report
                      </button>
                      <button
                        style={{
                          padding: '4px 12px',
                          fontSize: '12px',
                          border: '1px solid var(--color-primary)',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--color-primary)',
                          color: 'white',
                        }}
                      >
                        Export PDF
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'alerts' && (
            <div className="section">
              <h2 className="section__title">Alert Thresholds</h2>
              {isAdmin() ? (
                <div className="placeholder">
                  <div className="placeholder__icon">&#x2699;</div>
                  <div className="placeholder__text">Alert threshold configuration</div>
                  <div className="placeholder__subtext">
                    Configure severity thresholds, auto-escalation SLA timeouts,
                    and multi-channel notification routing (Email, Slack, PagerDuty, OpsGenie).
                  </div>
                </div>
              ) : (
                <div className="placeholder">
                  <div className="placeholder__text">Admin access required</div>
                  <div className="placeholder__subtext">
                    You are logged in as {user?.role ?? 'viewer'}. Contact an admin to change alert thresholds.
                  </div>
                </div>
              )}
            </div>
          )}

          {activeSection === 'integrations' && (
            <div className="section">
              <h2 className="section__title">External Integrations</h2>
              <div className="placeholder">
                <div className="placeholder__icon">&#x1F517;</div>
                <div className="placeholder__text">SIEM and ticketing integrations</div>
                <div className="placeholder__subtext">
                  Configure Syslog CEF/LEEF, Splunk HEC, Elastic endpoints, and
                  ticketing systems (Jira, ServiceNow).
                </div>
              </div>
            </div>
          )}

          {activeSection === 'general' && (
            <div className="section">
              <h2 className="section__title">General Settings</h2>
              <div className="placeholder">
                <div className="placeholder__icon">&#x2699;</div>
                <div className="placeholder__text">Application preferences</div>
                <div className="placeholder__subtext">
                  Session timeout, theme preference, and auto-refresh interval configuration.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
