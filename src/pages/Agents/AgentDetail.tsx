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

const TABS = ['Timeline', 'PCR Values', 'IMA Log', 'Boot Log', 'Certificates', 'Raw Data'] as const;
type Tab = (typeof TABS)[number];

export function AgentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('Timeline');

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
        <TabContent tab={activeTab} agentId={id!} />
      </div>
    </div>
  );
}

function TabContent({ tab, agentId }: { tab: Tab; agentId: string }) {
  switch (tab) {
    case 'Timeline':
      return <TimelineTab agentId={agentId} />;
    case 'PCR Values':
      return <PcrTab agentId={agentId} />;
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

function TimelineTab({ agentId }: { agentId: string }) {
  const { data } = useQuery({
    queryKey: ['agent', agentId, 'timeline'],
    queryFn: () => agentsApi.timeline(agentId),
    select: (res) => res.data,
  });

  return (
    <div>
      <h3 className="section__title">Attestation Timeline</h3>
      {data ? (
        <div className="placeholder">
          <div className="placeholder__icon">&#x1F4C8;</div>
          <div className="placeholder__text">Timeline chart ({data.length} data points)</div>
          <div className="placeholder__subtext">
            Zoomable attestation history with pass/fail coloring.
          </div>
        </div>
      ) : (
        <div className="placeholder">
          <div className="placeholder__text">Loading timeline...</div>
        </div>
      )}
    </div>
  );
}

function PcrTab({ agentId }: { agentId: string }) {
  const { data } = useQuery({
    queryKey: ['agent', agentId, 'pcr'],
    queryFn: () => agentsApi.pcrValues(agentId),
    select: (res) => res.data,
  });

  return (
    <div>
      <h3 className="section__title">PCR Values</h3>
      {data ? (
        <>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
            Hash algorithm: <strong>{data.hash_alg}</strong>
          </p>
          <table className="data-table" style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}>
            <thead>
              <tr>
                <th className="data-table__th">PCR Index</th>
                <th className="data-table__th">Value</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(data.pcrs)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([idx, val]) => (
                  <tr key={idx}>
                    <td className="data-table__td">{idx}</td>
                    <td className="data-table__td" style={{ fontFamily: 'monospace', fontSize: '12px' }}>{val}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </>
      ) : (
        <div className="placeholder">
          <div className="placeholder__text">Loading PCR values...</div>
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

function RawTab({ agentId }: { agentId: string }) {
  const { data } = useQuery({
    queryKey: ['agent', agentId, 'raw'],
    queryFn: () => agentsApi.raw(agentId),
    select: (res) => res.data,
  });

  return (
    <div>
      <h3 className="section__title">Raw Data</h3>
      <pre
        style={{
          background: 'var(--color-bg)',
          padding: '16px',
          borderRadius: 'var(--radius-sm)',
          overflow: 'auto',
          fontSize: '13px',
          fontFamily: 'monospace',
          maxHeight: '600px',
        }}
      >
        {data ? JSON.stringify(data, null, 2) : 'Loading...'}
      </pre>
    </div>
  );
}
