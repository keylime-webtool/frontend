import { useQuery } from '@tanstack/react-query';
import { useOutletContext } from 'react-router-dom';
import { KpiCard } from '@/components/common/KpiCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { attestationsApi } from '@/api/attestations';

interface FailureEvent {
  agent_id: string;
  detail: string;
  failure_type: string;
  severity: string;
  timestamp: string;
}

export function Attestations() {
  const { timeRange } = useOutletContext<{ timeRange: string }>();

  const { data: summary } = useQuery({
    queryKey: ['attestations', 'summary', timeRange],
    queryFn: () => attestationsApi.summary(timeRange),
    select: (res) => res.data,
  });

  const { data: failures } = useQuery({
    queryKey: ['attestations', 'failures', timeRange],
    queryFn: () => attestationsApi.failures(timeRange),
    select: (res) => res.data,
  });

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title">Attestation Analytics</h1>
        <p className="page-header__subtitle">Analyze attestation patterns, failures, and root causes</p>
      </div>

      <div className="kpi-grid">
        <KpiCard
          title="Successful"
          value={summary?.total_successful ?? '--'}
          variant="success"
        />
        <KpiCard
          title="Failed"
          value={summary?.total_failed ?? '--'}
          variant="danger"
        />
        <KpiCard
          title="Avg Latency"
          value={summary?.average_latency_ms != null ? `${summary.average_latency_ms}ms` : '--'}
        />
        <KpiCard
          title="Success Rate"
          value={summary?.success_rate != null ? `${summary.success_rate.toFixed(1)}%` : '--'}
          variant="success"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="section">
          <h2 className="section__title">Failure Categorization</h2>
          {Array.isArray(failures) && failures.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {(failures as unknown as FailureEvent[]).map((f, i) => (
                <li key={f.agent_id + i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{(f.failure_type ?? '').replace(/_/g, ' ')}</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{f.detail ?? ''}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>{f.agent_id}</div>
                  </div>
                  <StatusBadge label={f.severity} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="placeholder">
              <div className="placeholder__icon">&#x1F4CA;</div>
              <div className="placeholder__text">No failures recorded</div>
            </div>
          )}
        </div>

        <div className="section">
          <h2 className="section__title">Hourly Volume</h2>
          <div className="placeholder">
            <div className="placeholder__icon">&#x1F4CA;</div>
            <div className="placeholder__text">Attestation volume bar chart</div>
            <div className="placeholder__subtext">
              Hourly attestation counts with pass/fail stacking.
            </div>
          </div>
        </div>
      </div>

      <div className="section">
        <h2 className="section__title">Correlated Incidents</h2>
        <div className="placeholder">
          <div className="placeholder__icon">&#x1F50D;</div>
          <div className="placeholder__text">Root cause analysis</div>
          <div className="placeholder__subtext">
            Correlated failure incidents with suggested root causes and one-click policy rollback.
          </div>
        </div>
      </div>
    </div>
  );
}
