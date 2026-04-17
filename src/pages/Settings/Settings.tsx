import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useVisualizationStore } from '@/store/visualizationStore';
import { settingsApi } from '@/api/settings';
import { getBackendUrl, setBackendUrl } from '@/api/client';
import type { KeylimeSettings, CertificateSettings } from '@/api/settings';
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

  const { data: certSettings } = useQuery({
    queryKey: ['settings', 'certificates'],
    queryFn: () => settingsApi.getCertificates(),
    select: (res) => res.data as unknown as CertificateSettings,
  });

  // Environment mode defaults
  const ENV_DEFAULTS = {
    mock: { backend: 'http://localhost:8080', verifier: 'http://localhost:3000', registrar: 'http://localhost:3001' },
    production: { backend: 'http://localhost:8080', verifier: 'https://localhost:8881', registrar: 'https://localhost:8891' },
  } as const;

  type EnvMode = 'mock' | 'production';

  const detectEnvMode = (backend: string, verifier: string, registrar: string): EnvMode => {
    if (
      backend === ENV_DEFAULTS.mock.backend &&
      verifier === ENV_DEFAULTS.mock.verifier &&
      registrar === ENV_DEFAULTS.mock.registrar
    ) return 'mock';
    return 'production';
  };

  const [envMode, setEnvMode] = useState<EnvMode>('production');
  const [envModeDetected, setEnvModeDetected] = useState(false);

  const [backendUrlInitial] = useState(() => getBackendUrl());
  const [backendUrlField, setBackendUrlField] = useState(backendUrlInitial);

  const [verifierUrl, setVerifierUrl] = useState('');
  const [registrarUrl, setRegistrarUrl] = useState('');
  const [formLoaded, setFormLoaded] = useState(false);

  // Populate form fields once settings are loaded
  if (keylimeSettings && !formLoaded) {
    setVerifierUrl(keylimeSettings.verifier_url);
    setRegistrarUrl(keylimeSettings.registrar_url);
    setFormLoaded(true);
  }

  // Auto-detect environment mode once all three URLs are available
  if (formLoaded && !envModeDetected) {
    setEnvMode(detectEnvMode(backendUrlField, verifierUrl, registrarUrl));
    setEnvModeDetected(true);
  }

  const handleEnvModeSwitch = (mode: EnvMode) => {
    setEnvMode(mode);
    const defaults = ENV_DEFAULTS[mode];
    setBackendUrlField(defaults.backend);
    setVerifierUrl(defaults.verifier);
    setRegistrarUrl(defaults.registrar);
  };

  const [certPath, setCertPath] = useState('');
  const [keyPath, setKeyPath] = useState('');
  const [caCertPath, setCaCertPath] = useState('');
  const [certFormLoaded, setCertFormLoaded] = useState(false);
  const [certMode, setCertMode] = useState<'directory' | 'manual'>('directory');
  const [certDir, setCertDir] = useState('/var/lib/keylime/cv_ca');

  if (certSettings && !certFormLoaded) {
    setCertPath(certSettings.cert_path ?? '');
    setKeyPath(certSettings.key_path ?? '');
    setCaCertPath(certSettings.ca_cert_path ?? '');
    // Auto-detect mode: if all three paths share a common directory with standard names, use directory mode
    const ca = certSettings.ca_cert_path ?? '';
    const cert = certSettings.cert_path ?? '';
    const key = certSettings.key_path ?? '';
    if (ca && cert && key) {
      const caDir = ca.replace(/\/cacert\.crt$/, '');
      const certDirGuess = cert.replace(/\/client-cert\.crt$/, '');
      const keyDirGuess = key.replace(/\/client-private\.pem$/, '');
      if (caDir === certDirGuess && caDir === keyDirGuess && caDir !== ca) {
        setCertDir(caDir);
        setCertMode('directory');
      } else {
        setCertMode('manual');
      }
    }
    setCertFormLoaded(true);
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

  // Detect whether any connection URL has changed from its saved value
  const backendUrlChanged = backendUrlField.trim() !== backendUrlInitial;
  const verifierUrlChanged = formLoaded && verifierUrl.trim() !== (keylimeSettings?.verifier_url ?? '');
  const registrarUrlChanged = formLoaded && registrarUrl.trim() !== (keylimeSettings?.registrar_url ?? '');
  const connectionHasChanges = backendUrlChanged || verifierUrlChanged || registrarUrlChanged;

  const handleApplyConnection = async () => {
    // Save Backend URL (stored in browser) if changed
    if (backendUrlChanged) {
      setBackendUrl(backendUrlField.trim());
    }
    // Save Verifier + Registrar to backend API, then reload
    if (verifierUrlChanged || registrarUrlChanged) {
      updateMutation.mutate(
        { verifier_url: verifierUrl.trim(), registrar_url: registrarUrl.trim() },
        { onSuccess: () => window.location.reload() },
      );
    } else {
      // Only backend URL changed — reload immediately
      window.location.reload();
    }
  };

  const [certSaveStatus, setCertSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [certErrorMsg, setCertErrorMsg] = useState('');

  const certMutation = useMutation({
    mutationFn: (settings: CertificateSettings) => settingsApi.updateCertificates(settings),
    onMutate: () => { setCertSaveStatus('saving'); setCertErrorMsg(''); },
    onSuccess: () => {
      setCertSaveStatus('saved');
      setCertFormLoaded(false); // reload saved values
      queryClient.invalidateQueries({ queryKey: ['settings', 'certificates'] });
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      setTimeout(() => setCertSaveStatus('idle'), 3000);
    },
    onError: (err: unknown) => {
      setCertSaveStatus('error');
      const axiosErr = err as { response?: { data?: { error?: string; message?: string } } };
      setCertErrorMsg(
        axiosErr?.response?.data?.error
        || axiosErr?.response?.data?.message
        || 'Failed to apply certificate settings',
      );
      setTimeout(() => setCertSaveStatus('idle'), 5000);
    },
  });

  // Determine whether current form values differ from saved settings
  const savedCa = certSettings?.ca_cert_path ?? null;
  const savedCert = certSettings?.cert_path ?? null;
  const savedKey = certSettings?.key_path ?? null;

  const certHasChanges = (() => {
    if (certMode === 'directory') {
      const dir = certDir.trim().replace(/\/+$/, '');
      if (!dir) return savedCa !== null || savedCert !== null || savedKey !== null;
      return `${dir}/cacert.crt` !== savedCa
        || `${dir}/client-cert.crt` !== savedCert
        || `${dir}/client-private.pem` !== savedKey;
    }
    return (certPath.trim() || null) !== savedCert
      || (keyPath.trim() || null) !== savedKey
      || (caCertPath.trim() || null) !== savedCa;
  })();

  const handleSaveCertificates = () => {
    if (certMode === 'directory') {
      const dir = certDir.trim().replace(/\/+$/, '');
      if (!dir) {
        certMutation.mutate({ cert_path: null, key_path: null, ca_cert_path: null });
      } else {
        certMutation.mutate({
          ca_cert_path: `${dir}/cacert.crt`,
          cert_path: `${dir}/client-cert.crt`,
          key_path: `${dir}/client-private.pem`,
        });
      }
    } else {
      certMutation.mutate({
        cert_path: certPath.trim() || null,
        key_path: keyPath.trim() || null,
        ca_cert_path: caCertPath.trim() || null,
      });
    }
  };

  const sections = [
    { key: 'keylime', label: 'Keylime Connection' },
    { key: 'certificates', label: 'Keylime Certificates' },
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h2 className="section__title" style={{ margin: 0 }}>Keylime Connection</h2>
                <div style={{
                  display: 'inline-flex',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  overflow: 'hidden',
                }}>
                  <button
                    onClick={() => handleEnvModeSwitch('mock')}
                    style={{
                      padding: '5px 14px',
                      fontSize: '12px',
                      fontWeight: envMode === 'mock' ? 600 : 400,
                      border: 'none',
                      background: envMode === 'mock' ? 'var(--color-primary)' : 'var(--color-surface)',
                      color: envMode === 'mock' ? 'white' : 'var(--color-text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    Mock
                  </button>
                  <button
                    onClick={() => handleEnvModeSwitch('production')}
                    style={{
                      padding: '5px 14px',
                      fontSize: '12px',
                      fontWeight: envMode === 'production' ? 600 : 400,
                      border: 'none',
                      borderLeft: '1px solid var(--color-border)',
                      background: envMode === 'production' ? 'var(--color-primary)' : 'var(--color-surface)',
                      color: envMode === 'production' ? 'white' : 'var(--color-text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    Production
                  </button>
                </div>
              </div>
              <div>
                <div style={settingRowStyle}>
                  <div style={{ flex: 1 }}>
                    <div style={settingLabelStyle}>Backend URL</div>
                    <div style={settingDescStyle}>Base URL of the Keylime Webtool Backend API</div>
                  </div>
                  <input
                    type="text"
                    value={backendUrlField}
                    onChange={(e) => setBackendUrlField(e.target.value)}
                    placeholder="http://localhost:8080"
                    style={{ ...selectStyle, width: '260px' }}
                    aria-label="Backend URL"
                  />
                </div>

                <div style={settingRowStyle}>
                  <div style={{ flex: 1 }}>
                    <div style={settingLabelStyle}>Verifier URL</div>
                    <div style={settingDescStyle}>Base URL of the Keylime Verifier API</div>
                  </div>
                  <input
                    type="text"
                    value={verifierUrl}
                    onChange={(e) => setVerifierUrl(e.target.value)}
                    placeholder="https://localhost:8881"
                    style={{ ...selectStyle, width: '260px' }}
                    aria-label="Verifier URL"
                  />
                </div>
                {verifierUrl.trim().startsWith('http://') && (
                  <div style={{
                    padding: '8px 12px',
                    marginTop: '-8px',
                    marginBottom: '4px',
                    fontSize: '12px',
                    color: 'var(--color-warning, #e8a317)',
                    background: 'var(--color-warning-bg, rgba(232,163,23,0.08))',
                    borderRadius: 'var(--radius-sm)',
                  }}>
                    Note: The Keylime Verifier typically requires HTTPS. HTTP may only work with mock/development instances.
                  </div>
                )}

                <div style={settingRowStyle}>
                  <div style={{ flex: 1 }}>
                    <div style={settingLabelStyle}>Registrar URL</div>
                    <div style={settingDescStyle}>Base URL of the Keylime Registrar API</div>
                  </div>
                  <input
                    type="text"
                    value={registrarUrl}
                    onChange={(e) => setRegistrarUrl(e.target.value)}
                    placeholder="https://localhost:8891"
                    style={{ ...selectStyle, width: '260px' }}
                    aria-label="Registrar URL"
                  />
                </div>
                {registrarUrl.trim().startsWith('http://') && (
                  <div style={{
                    padding: '8px 12px',
                    marginTop: '-8px',
                    marginBottom: '4px',
                    fontSize: '12px',
                    color: 'var(--color-warning, #e8a317)',
                    background: 'var(--color-warning-bg, rgba(232,163,23,0.08))',
                    borderRadius: 'var(--radius-sm)',
                  }}>
                    Note: The Keylime Registrar typically requires HTTPS. HTTP may only work with mock/development instances.
                  </div>
                )}

                <div style={{ ...settingRowStyle, borderBottom: 'none', justifyContent: 'flex-end', gap: '12px' }}>
                  {saveStatus === 'saved' && (
                    <span style={{ color: 'var(--color-success, #34a853)', fontSize: '14px' }}>
                      Settings applied
                    </span>
                  )}
                  {saveStatus === 'error' && (
                    <span style={{ color: 'var(--color-danger, #ea4335)', fontSize: '14px' }}>
                      Failed to apply settings
                    </span>
                  )}
                  <button
                    onClick={handleApplyConnection}
                    disabled={!connectionHasChanges || saveStatus === 'saving'}
                    style={{
                      padding: '8px 24px',
                      fontSize: '14px',
                      fontWeight: 500,
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      background: connectionHasChanges ? 'var(--color-primary)' : 'var(--color-border)',
                      color: connectionHasChanges ? 'white' : 'var(--color-text-secondary)',
                      cursor: connectionHasChanges && saveStatus !== 'saving' ? 'pointer' : 'default',
                    }}
                  >
                    {saveStatus === 'saving' ? 'Applying...' : 'Apply Changes'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'certificates' && (
            <div className="section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 className="section__title" style={{ margin: 0 }}>Keylime Certificates</h2>
                <div style={{
                  display: 'inline-flex',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  overflow: 'hidden',
                }}>
                  <button
                    onClick={() => setCertMode('directory')}
                    style={{
                      padding: '5px 14px',
                      fontSize: '12px',
                      fontWeight: certMode === 'directory' ? 600 : 400,
                      border: 'none',
                      background: certMode === 'directory' ? 'var(--color-primary)' : 'var(--color-surface)',
                      color: certMode === 'directory' ? 'white' : 'var(--color-text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    By directory
                  </button>
                  <button
                    onClick={() => setCertMode('manual')}
                    style={{
                      padding: '5px 14px',
                      fontSize: '12px',
                      fontWeight: certMode === 'manual' ? 600 : 400,
                      border: 'none',
                      borderLeft: '1px solid var(--color-border)',
                      background: certMode === 'manual' ? 'var(--color-primary)' : 'var(--color-surface)',
                      color: certMode === 'manual' ? 'white' : 'var(--color-text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    Manually
                  </button>
                </div>
              </div>
              <div>
                {certMode === 'directory' ? (
                  <div style={settingRowStyle}>
                    <div style={{ flex: 1 }}>
                      <div style={settingLabelStyle}>Certificate directory</div>
                      <div style={settingDescStyle}>
                        <strong>Backend directory</strong> containing cacert.crt, client-cert.crt, and client-private.pem
                      </div>
                    </div>
                    <input
                      type="text"
                      value={certDir}
                      onChange={(e) => setCertDir(e.target.value)}
                      placeholder="/var/lib/keylime/cv_ca"
                      style={{ ...selectStyle, width: '320px' }}
                      aria-label="Certificate directory"
                    />
                  </div>
                ) : (
                  <>
                    <div style={settingRowStyle}>
                      <div style={{ flex: 1 }}>
                        <div style={settingLabelStyle}>CA Certificate</div>
                        <div style={settingDescStyle}>Path to the CA certificate file on the backend server</div>
                      </div>
                      <input
                        type="text"
                        value={caCertPath}
                        onChange={(e) => setCaCertPath(e.target.value)}
                        placeholder="/var/lib/keylime/cv_ca/cacert.crt"
                        style={{ ...selectStyle, width: '320px' }}
                        aria-label="CA certificate path"
                      />
                    </div>

                    <div style={settingRowStyle}>
                      <div style={{ flex: 1 }}>
                        <div style={settingLabelStyle}>Client Certificate</div>
                        <div style={settingDescStyle}>Path to the client certificate file on the backend server</div>
                      </div>
                      <input
                        type="text"
                        value={certPath}
                        onChange={(e) => setCertPath(e.target.value)}
                        placeholder="/var/lib/keylime/cv_ca/client-cert.crt"
                        style={{ ...selectStyle, width: '320px' }}
                        aria-label="Client certificate path"
                      />
                    </div>

                    <div style={settingRowStyle}>
                      <div style={{ flex: 1 }}>
                        <div style={settingLabelStyle}>Client Key</div>
                        <div style={settingDescStyle}>Path to the client private key file on the backend server</div>
                      </div>
                      <input
                        type="text"
                        value={keyPath}
                        onChange={(e) => setKeyPath(e.target.value)}
                        placeholder="/var/lib/keylime/cv_ca/client-private.pem"
                        style={{ ...selectStyle, width: '320px' }}
                        aria-label="Client key path"
                      />
                    </div>
                  </>
                )}

                {certSaveStatus === 'error' && certErrorMsg && (
                  <div style={{
                    padding: '8px 12px',
                    fontSize: '12px',
                    color: 'var(--color-danger, #ea4335)',
                    background: 'var(--color-danger-bg, rgba(234,67,53,0.08))',
                    borderRadius: 'var(--radius-sm)',
                    marginTop: '4px',
                  }}>
                    {certErrorMsg}
                  </div>
                )}

                <div style={{ ...settingRowStyle, borderBottom: 'none', justifyContent: 'flex-end', gap: '12px' }}>
                  {certSaveStatus === 'saved' && (
                    <span style={{ color: 'var(--color-success, #34a853)', fontSize: '14px' }}>
                      Certificates configured
                    </span>
                  )}
                  <button
                    onClick={handleSaveCertificates}
                    disabled={!certHasChanges || certSaveStatus === 'saving'}
                    style={{
                      padding: '8px 24px',
                      fontSize: '14px',
                      fontWeight: 500,
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      background: certHasChanges ? 'var(--color-primary)' : 'var(--color-border)',
                      color: certHasChanges ? 'white' : 'var(--color-text-secondary)',
                      cursor: certHasChanges && certSaveStatus !== 'saving' ? 'pointer' : 'default',
                    }}
                  >
                    {certSaveStatus === 'saving' ? 'Applying...' : 'Apply'}
                  </button>
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
