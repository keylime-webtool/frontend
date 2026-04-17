import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { StatusBadge } from '@/components/common/StatusBadge';
import { agentsApi } from '@/api/agents';

interface AgentDetail {
  id: string;
  ip: string;
  port: number;
  state: string;
  attestation_mode: string;
  ima_policy: string | null;
  mb_policy: string | null;
  [key: string]: unknown;
}

const TABS = ['TPM Policy', 'IMA Log', 'Boot Log', 'Certificates', 'Timeline', 'Raw Data'] as const;
type Tab = (typeof TABS)[number];

export function AgentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('TPM Policy');

  const { data: agent, isLoading } = useQuery({
    queryKey: ['agent', id],
    queryFn: () => agentsApi.get(id!),
    select: (res) => res.data as unknown as AgentDetail,
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="placeholder">
        <div className="placeholder__text">Loading agent details...</div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="placeholder">
        <div className="placeholder__text">Agent not found</div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={() => navigate('/agents')}
          style={{
            background: 'none',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '6px 12px',
            fontSize: '14px',
            color: 'var(--color-text)',
          }}
          aria-label="Back to agents list"
        >
          &larr; Back
        </button>
        <div>
          <h1 className="page-header__title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontFamily: 'monospace', fontSize: '20px' }}>{agent.id ?? id}</span>
            <StatusBadge label={agent.state} />
          </h1>
          <p className="page-header__subtitle">
            {agent.ip}:{agent.port} &middot; {agent.attestation_mode} mode
            {agent.ima_policy && <> &middot; Policy: {agent.ima_policy}</>}
          </p>
        </div>
      </div>

      <div className="tabs" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            className={`tab${activeTab === tab ? ' tab--active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="section">
        <TabContent tab={activeTab} agentId={id!} agent={agent} />
      </div>
    </div>
  );
}

function TabContent({ tab, agentId, agent }: { tab: Tab; agentId: string; agent: AgentDetail }) {
  switch (tab) {
    case 'Timeline':
      return <TimelineTab agentId={agentId} />;
    case 'TPM Policy':
      return <TpmPolicyTab tpmPolicy={agent.tpm_policy as string | null | undefined} />;
    case 'IMA Log':
      return <ImaTab agentId={agentId} />;
    case 'Boot Log':
      return <BootLogTab agentId={agentId} />;
    case 'Certificates':
      return <CertsTab agentId={agentId} />;
    case 'Raw Data':
      return <RawTab agentId={agentId} />;
  }
}

interface TimelineEvent {
  timestamp: string;
  event: string;
  detail: string;
}

const EVENT_VARIANTS: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  attestation_success: 'success',
  attestation_failed: 'danger',
  registered: 'info',
  first_attestation: 'info',
};

function TimelineTab({ agentId }: { agentId: string }) {
  const { data } = useQuery({
    queryKey: ['agent', agentId, 'timeline'],
    queryFn: () => agentsApi.timeline(agentId),
    select: (res) => res.data,
  });

  const events: TimelineEvent[] = Array.isArray(data) ? data as unknown as TimelineEvent[] : [];

  return (
    <div>
      <h3 className="section__title">Attestation Timeline</h3>
      {events.length > 0 ? (
        <div className="data-table__wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th className="data-table__th">Timestamp</th>
                <th className="data-table__th">Event</th>
                <th className="data-table__th">Detail</th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev, i) => (
                <tr key={i} className="data-table__row">
                  <td className="data-table__td" style={{ fontFamily: 'monospace', fontSize: '12px', whiteSpace: 'nowrap' }}>
                    {new Date(ev.timestamp).toLocaleString()}
                  </td>
                  <td className="data-table__td">
                    <StatusBadge
                      label={ev.event.replace(/_/g, ' ')}
                      variant={EVENT_VARIANTS[ev.event]}
                    />
                  </td>
                  <td className="data-table__td">{ev.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="placeholder">
          <div className="placeholder__icon">&#x1F4C8;</div>
          <div className="placeholder__text">No attestation timeline data</div>
          <div className="placeholder__subtext">
            Attestation history will appear here once events are recorded for this agent.
          </div>
        </div>
      )}
    </div>
  );
}

function TpmPolicyTab({ tpmPolicy }: { tpmPolicy: string | null | undefined }) {
  // tpm_policy is a JSON string like: {"0": ["0xhash..."], "mask": "0x1"}
  let parsed: Record<string, unknown> | null = null;
  if (tpmPolicy) {
    try {
      parsed = JSON.parse(tpmPolicy);
    } catch {
      // invalid JSON — show raw
    }
  }

  if (!parsed) {
    return (
      <div>
        <h3 className="section__title">TPM Policy</h3>
        {tpmPolicy ? (
          <pre style={{
            background: 'var(--color-bg)',
            color: 'var(--color-text)',
            padding: '16px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '13px',
            fontFamily: 'monospace',
          }}>
            {tpmPolicy}
          </pre>
        ) : (
          <div className="placeholder">
            <div className="placeholder__text">No TPM policy configured</div>
            <div className="placeholder__subtext">
              This agent does not have a TPM policy with expected PCR values.
            </div>
          </div>
        )}
      </div>
    );
  }

  const mask = parsed.mask as string | undefined;
  const pcrEntries = Object.entries(parsed)
    .filter(([key]) => key !== 'mask')
    .sort(([a], [b]) => Number(a) - Number(b));

  return (
    <div>
      <h3 className="section__title">TPM Policy</h3>
      {mask && (
        <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
          PCR mask: <strong style={{ fontFamily: 'monospace' }}>{mask}</strong>
        </p>
      )}
      {pcrEntries.length > 0 ? (
        <table className="data-table" style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}>
          <thead>
            <tr>
              <th className="data-table__th">PCR Index</th>
              <th className="data-table__th">Expected Values</th>
            </tr>
          </thead>
          <tbody>
            {pcrEntries.map(([idx, values]) => (
              <tr key={idx}>
                <td className="data-table__td">{idx}</td>
                <td className="data-table__td" style={{ fontFamily: 'monospace', fontSize: '12px', wordBreak: 'break-all' }}>
                  {Array.isArray(values) ? values.join(', ') : String(values)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="placeholder">
          <div className="placeholder__text">No PCR entries in policy</div>
        </div>
      )}
    </div>
  );
}

function ImaTab({ agentId }: { agentId: string }) {
  const { data } = useQuery({
    queryKey: ['agent', agentId, 'ima'],
    queryFn: () => agentsApi.imaLog(agentId),
    select: (res) => res.data,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const entries = (data as any)?.entries ?? [];

  return (
    <div>
      <h3 className="section__title">IMA Log ({entries.length} entries)</h3>
      {entries.length > 0 ? (
        <div className="data-table__wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th className="data-table__th">PCR</th>
                <th className="data-table__th">Template</th>
                <th className="data-table__th">File</th>
                <th className="data-table__th">Hash</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry: { pcr: number; template_name: string; filename: string; filedata_hash: string }, i: number) => (
                <tr key={i} className="data-table__row">
                  <td className="data-table__td">{entry.pcr}</td>
                  <td className="data-table__td" style={{ fontFamily: 'monospace', fontSize: '12px' }}>{entry.template_name}</td>
                  <td className="data-table__td">{entry.filename}</td>
                  <td className="data-table__td" style={{ fontFamily: 'monospace', fontSize: '11px', wordBreak: 'break-all' }}>{entry.filedata_hash}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="placeholder">
          <div className="placeholder__text">No IMA log entries</div>
        </div>
      )}
    </div>
  );
}

function BootLogTab({ agentId }: { agentId: string }) {
  const { data } = useQuery({
    queryKey: ['agent', agentId, 'bootlog'],
    queryFn: () => agentsApi.bootLog(agentId),
    select: (res) => res.data,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const entries = (data as any)?.entries ?? [];

  return (
    <div>
      <h3 className="section__title">Boot Log ({entries.length} entries)</h3>
      {entries.length > 0 ? (
        <div className="data-table__wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th className="data-table__th">PCR</th>
                <th className="data-table__th">Event Type</th>
                <th className="data-table__th">Event Data</th>
                <th className="data-table__th">Digest</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry: { pcr: number; event_type: string; event_data: string; digest: string }, i: number) => (
                <tr key={i} className="data-table__row">
                  <td className="data-table__td">{entry.pcr}</td>
                  <td className="data-table__td" style={{ fontFamily: 'monospace', fontSize: '12px' }}>{entry.event_type}</td>
                  <td className="data-table__td">{entry.event_data}</td>
                  <td className="data-table__td" style={{ fontFamily: 'monospace', fontSize: '11px', wordBreak: 'break-all' }}>{entry.digest}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="placeholder">
          <div className="placeholder__text">No boot log entries</div>
        </div>
      )}
    </div>
  );
}

function CertsTab({ agentId }: { agentId: string }) {
  const { data } = useQuery({
    queryKey: ['agent', agentId, 'certs'],
    queryFn: () => agentsApi.certificates(agentId),
    select: (res) => res.data,
  });

  void data;

  return (
    <div>
      <h3 className="section__title">Certificates</h3>
      <div className="placeholder">
        <div className="placeholder__icon">&#x1F512;</div>
        <div className="placeholder__text">Agent certificates</div>
        <div className="placeholder__subtext">
          EK, AK, IAK, IDevID, and mTLS certificates with expiry countdowns.
        </div>
      </div>
    </div>
  );
}

const RAW_SOURCES = ['combined', 'backend', 'registrar', 'verifier'] as const;
type RawSource = (typeof RAW_SOURCES)[number];

const RAW_SOURCE_LABELS: Record<RawSource, string> = {
  combined: 'All',
  backend: 'Backend',
  registrar: 'Registrar',
  verifier: 'Verifier',
};

function RawTab({ agentId }: { agentId: string }) {
  const [source, setSource] = useState<RawSource>('combined');

  const { data, isLoading } = useQuery({
    queryKey: ['agent', agentId, 'raw', source],
    queryFn: () => agentsApi.raw(agentId, source === 'combined' ? undefined : source),
    select: (res) => res.data,
  });

  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <h3 className="section__title" style={{ margin: 0 }}>Raw Data</h3>
        <div style={{
          display: 'inline-flex',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-sm)',
          overflow: 'hidden',
          flexShrink: 0,
        }}>
          {RAW_SOURCES.map((s, i) => (
            <button
              key={s}
              onClick={() => setSource(s)}
              style={{
                padding: '5px 14px',
                fontSize: '12px',
                fontWeight: source === s ? 600 : 400,
                border: 'none',
                borderLeft: i > 0 ? '1px solid var(--color-border)' : 'none',
                background: source === s ? 'var(--color-primary)' : 'var(--color-surface)',
                color: source === s ? 'white' : 'var(--color-text-secondary)',
                cursor: 'pointer',
              }}
            >
              {RAW_SOURCE_LABELS[s]}
            </button>
          ))}
        </div>
      </div>
      <pre
        style={{
          background: 'var(--color-bg)',
          color: 'var(--color-text)',
          padding: '16px',
          borderRadius: 'var(--radius-sm)',
          overflow: 'auto',
          fontSize: '13px',
          fontFamily: 'monospace',
          maxHeight: '600px',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
        }}
      >
        {isLoading ? 'Loading...' : data ? JSON.stringify(data, null, 2) : 'No data available'}
      </pre>
    </div>
  );
}
