import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  PieChart, Pie, Cell, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { KpiCard } from '@/components/common/KpiCard';
import { AgentStateChart } from '@/components/common/AgentStateChart';
import { attestationsApi } from '@/api/attestations';
import { agentsApi } from '@/api/agents';
import { alertsApi } from '@/api/alerts';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useFormatTimestamp } from '@/store/visualizationStore';
import type { Alert } from '@/types';
import {
  ALERT_SEVERITY_COLORS, ALERT_TYPE_COLORS, ALERT_STATE_COLORS, ALERT_FALLBACK_COLOR,
} from '@/constants/colors';
import { createPieLabelRenderer } from '@/utils/pieLabel';

type AlertChartDimension = 'severity' | 'type' | 'state';

const ALERT_COLOR_MAPS: Record<AlertChartDimension, Record<string, string>> = {
  severity: ALERT_SEVERITY_COLORS,
  type: ALERT_TYPE_COLORS,
  state: ALERT_STATE_COLORS,
};

// Agent states used to derive attestation stats as a fallback
const FAILED_STATES = new Set([
  'FAILED', 'INVALID_QUOTE', 'TENANT_FAILED', 'FAIL', 'TIMEOUT',
]);
const ATTESTED_STATES = new Set([
  'GET_QUOTE', 'PROVIDE_V', 'REGISTERED', 'PASS',
  'FAILED', 'INVALID_QUOTE', 'TENANT_FAILED', 'FAIL', 'TIMEOUT',
]);

export function Dashboard() {
  const { timeRange } = useOutletContext<{ timeRange: string }>();
  const navigate = useNavigate();
  const fmtTs = useFormatTimestamp();

  const { data: agents } = useQuery({
    queryKey: ['agents', 'dashboard'],
    queryFn: () => agentsApi.list({ per_page: 100 }),
    select: (res) => res.data,
  });

  const { data: attestationSummary } = useQuery({
    queryKey: ['attestations', 'summary', timeRange],
    queryFn: () => attestationsApi.summary(timeRange),
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

  const { data: alertSummary } = useQuery({
    queryKey: ['alerts', 'summary'],
    queryFn: () => alertsApi.summary(),
    select: (res) => res.data,
  });

  const { data: alertsData } = useQuery({
    queryKey: ['alerts', 'dashboard'],
    queryFn: () => alertsApi.list({ per_page: 100 }),
    select: (res) => res.data,
  });

  const [alertChartDimension, setAlertChartDimension] = useState<AlertChartDimension>('severity');

  const agentItems = useMemo(
    () => Array.isArray(agents?.items) ? agents.items : Array.isArray(agents) ? agents : [],
    [agents]
  );

  // Derive attestation stats from agent states when the summary endpoint
  // returns no data (e.g. backend attestation history not yet available).
  const agentAttestation = useMemo(() => {
    const attested = agentItems.filter((a) => ATTESTED_STATES.has((a.state ?? '').toUpperCase()));
    if (attested.length === 0) return null;
    const failedCount = attested.filter((a) => FAILED_STATES.has((a.state ?? '').toUpperCase())).length;
    const successRate = ((attested.length - failedCount) / attested.length) * 100;
    return { successRate, failedCount };
  }, [agentItems]);

  const alertItems: Alert[] = useMemo(
    () => Array.isArray(alertsData?.items) ? alertsData.items : Array.isArray(alertsData) ? alertsData : [],
    [alertsData]
  );

  const alertChartData = useMemo(() => {
    const counts = new Map<string, number>();
    for (const alert of alertItems) {
      const key = alert[alertChartDimension] ?? 'unknown';
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
  }, [alertItems, alertChartDimension]);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title">Fleet Overview</h1>
        <p className="page-header__subtitle">
          Real-time Keylime attestation monitoring dashboard
        </p>
      </div>

      <div className="kpi-grid">
        <KpiCard
          title="Total Agents"
          value={agents?.total_items ?? (agentItems.length || '--')}
          variant="default"
          linkTo="/agents"
        />
        <KpiCard
          title="Attestation Success Rate"
          value={
            attestationSummary?.success_rate != null
              ? `${attestationSummary.success_rate === 100 ? '100.0' : attestationSummary.success_rate.toFixed(2)}%`
              : agentAttestation
                ? `${agentAttestation.successRate === 100 ? '100.0' : agentAttestation.successRate.toFixed(2)}%`
                : '--'
          }
          variant="success"
          linkTo="/attestations"
        />
        <KpiCard
          title="Failed Attestations"
          value={attestationSummary?.total_failed ?? agentAttestation?.failedCount ?? '--'}
          variant="danger"
          subtitle={`in last ${timeRange}`}
          linkTo="/agents?state=FAILED,INVALID_QUOTE,TENANT_FAILED,FAIL,TIMEOUT"
        />
        <KpiCard
          title="Urgent Alerts"
          value={alertSummary?.active_alerts ?? '--'}
          variant="warning"
          subtitle={`${alertSummary?.active_critical ?? 0} critical, ${alertSummary != null ? alertSummary.active_alerts - alertSummary.active_critical : 0} warnings`}
          linkTo="/alerts"
        />
      </div>

      <div className="charts-row">
      <div className="section">
        <h2 className="section__title">Agent State Distribution</h2>
        <AgentStateChart />
      </div>

      <div className="section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 className="section__title" style={{ margin: 0 }}>Alert Distribution</h2>
          <div role="group" aria-label="Alert chart dimension" style={{ display: 'flex', gap: '4px' }}>
            {(['severity', 'type', 'state'] as AlertChartDimension[]).map((dim) => (
              <button
                key={dim}
                onClick={() => setAlertChartDimension(dim)}
                style={{
                  padding: '6px 14px',
                  fontSize: '13px',
                  fontWeight: alertChartDimension === dim ? 600 : 400,
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  background: alertChartDimension === dim ? 'var(--color-primary)' : 'var(--color-surface)',
                  color: alertChartDimension === dim ? '#fff' : 'var(--color-text)',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {dim}
              </button>
            ))}
          </div>
        </div>
        {alertChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={alertChartData}
                cx="50%"
                cy="50%"
                outerRadius={90}
                innerRadius={45}
                dataKey="value"
                nameKey="name"
                label={createPieLabelRenderer({
                  colors: ALERT_COLOR_MAPS[alertChartDimension],
                  fallbackColor: ALERT_FALLBACK_COLOR,
                  onClick: (name) => navigate(`/alerts?${alertChartDimension}=${encodeURIComponent(name)}`),
                })}
                labelLine
                style={{ cursor: 'pointer' }}
                onClick={(_data, index) => {
                  const entry = alertChartData[index];
                  if (entry) {
                    navigate(`/alerts?${alertChartDimension}=${encodeURIComponent(entry.name)}`);
                  }
                }}
              >
                {alertChartData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={ALERT_COLOR_MAPS[alertChartDimension][entry.name] ?? ALERT_FALLBACK_COLOR}
                  />
                ))}
              </Pie>
              <Legend
                formatter={(value: string) => (
                  <span style={{ textTransform: 'capitalize', cursor: 'pointer' }}>
                    {value.replace(/_/g, ' ')}
                  </span>
                )}
                onClick={() => navigate('/alerts')}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="placeholder">
            <div className="placeholder__icon">&#x25EF;</div>
            <div className="placeholder__text">No alert data to display</div>
          </div>
        )}
      </div>
      </div>

      <div className="section">
        <h2 className="section__title">Attestation Success Rate ({timeRange})</h2>
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
              <Bar dataKey="successful" name="Successful" fill="#34a853" stackId="a" />
              <Bar dataKey="failed" name="Failed" fill="#ea4335" stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="placeholder">
            <div className="placeholder__icon">&#x1F4CA;</div>
            <div className="placeholder__text">No attestation timeline data</div>
            <div className="placeholder__subtext">
              Attestation history will appear here once the backend records pass/fail events.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
