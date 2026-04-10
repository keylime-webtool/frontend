import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

const COMPLIANCE_FRAMEWORKS = [
  'NIST SP 800-155/193',
  'PCI DSS 4.0',
  'SOC 2 Type II',
  'FedRAMP',
  'CIS Controls v8',
];

export function Settings() {
  const { user, isAdmin } = useAuth();
  const [activeSection, setActiveSection] = useState('compliance');

  const sections = [
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
