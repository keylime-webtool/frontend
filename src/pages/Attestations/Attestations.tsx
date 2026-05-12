import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useOutletContext, Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { KpiCard } from '@/components/common/KpiCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { attestationsApi } from '@/api/attestations';
import { useFormatTimestamp } from '@/store/visualizationStore';
import { ATTESTATION_COLORS } from '@/constants/colors';

interface FailureEvent {
  agent_id: string;
  detail: string;
  failure_type: string;
  severity: string;
  timestamp: string;
}

export function Attestations() {
  const { timeRange } = useOutletContext<{ timeRange: string }>();
  const fmtTs = useFormatTimestamp();

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

  const { data: attestationTimeline } = useQuery({
    queryKey: ['attestations', 'timeline', timeRange],
    queryFn: () => attestationsApi.timeline(timeRange),
    select: (res) => res.data,
  });

  const timelineData = useMemo(() => {
    const raw = Array.isArray(attestationTimeline) ? attestationTimeline : [];
    return raw.map((point) => ({
      ...point,
      label: fmtTs(point.hour, {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
      }),
    }));
  }, [attestationTimeline, fmtTs]);

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
          title="Timed Out"
          value={summary?.total_timed_out ?? '--'}
          variant="warning"
        />
        <KpiCard
          title="Avg Latency"
          value={summary?.average_latency_ms != null ? `${summary.average_latency_ms}ms` : '--'}
        />
        <KpiCard
          title="Success Rate"
          value={summary?.success_rate != null ? `${summary.success_rate === 100 ? '100.0' : summary.success_rate.toFixed(2)}%` : '--'}
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
                    <Link to={`/agents/${f.agent_id}`} style={{ fontSize: '11px', color: 'var(--color-primary)', fontFamily: 'monospace', textDecoration: 'none' }}>{f.agent_id}</Link>
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
          {timelineData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="label" fontSize={11} tick={{ fill: 'var(--color-text-secondary)' }} />
                <YAxis fontSize={11} tick={{ fill: 'var(--color-text-secondary)' }} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--color-text)',
                  }}
                />
                <Bar dataKey="successful" name="Successful" fill={ATTESTATION_COLORS.successful} stackId="a" />
                <Bar dataKey="failed" name="Failed" fill={ATTESTATION_COLORS.failed} stackId="a" />
                <Bar dataKey="timed_out" name="Timed Out" fill={ATTESTATION_COLORS.timed_out} stackId="a" />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="placeholder">
              <div className="placeholder__icon">&#x1F4CA;</div>
              <div className="placeholder__text">Attestation volume bar chart</div>
              <div className="placeholder__subtext">
                Hourly attestation counts with pass/fail stacking.
              </div>
            </div>
          )}
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
