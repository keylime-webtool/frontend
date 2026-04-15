import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PieChart, Pie, Cell, Legend, ResponsiveContainer } from 'recharts';
import { KpiCard } from '@/components/common/KpiCard';
import { AgentStateChart } from '@/components/common/AgentStateChart';
import { attestationsApi } from '@/api/attestations';
import { agentsApi } from '@/api/agents';
import { alertsApi } from '@/api/alerts';
import { useOutletContext, useNavigate } from 'react-router-dom';
import type { Alert } from '@/types';

type AlertChartDimension = 'severity' | 'type' | 'state';

const ALERT_SEVERITY_COLORS: Record<string, string> = {
  critical: '#ea4335',
  warning: '#f9ab00',
  info: '#1a73e8',
};

const ALERT_STATE_COLORS: Record<string, string> = {
  new: '#ea4335',
  acknowledged: '#f9ab00',
  under_investigation: '#4285f4',
  resolved: '#34a853',
  dismissed: '#9e9e9e',
};

const ALERT_TYPE_COLORS: Record<string, string> = {
  attestation_failure: '#ea4335',
  cert_expiry: '#f9ab00',
  policy_violation: '#e8710a',
  pcr_change: '#9334e6',
  service_down: '#d93025',
  rate_limit: '#4285f4',
  clock_skew: '#00897b',
};

const ALERT_COLOR_MAPS: Record<AlertChartDimension, Record<string, string>> = {
  severity: ALERT_SEVERITY_COLORS,
  type: ALERT_TYPE_COLORS,
  state: ALERT_STATE_COLORS,
};

const ALERT_FALLBACK_COLOR = '#bdbdbd';

// Agent states used to derive attestation stats as a fallback
const FAILED_STATES = new Set([
  'FAILED', 'INVALID_QUOTE', 'TENANT_FAILED', 'FAIL',
]);
const ATTESTED_STATES = new Set([
  'GET_QUOTE', 'PROVIDE_V', 'REGISTERED', 'PASS',
  'FAILED', 'INVALID_QUOTE', 'TENANT_FAILED', 'FAIL',
]);

export function Dashboard() {
  const { timeRange } = useOutletContext<{ timeRange: string }>();
  const navigate = useNavigate();

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
        />
        <KpiCard
          title="Attestation Success Rate"
          value={
            attestationSummary?.success_rate != null
              ? `${attestationSummary.success_rate.toFixed(1)}%`
              : agentAttestation
                ? `${agentAttestation.successRate.toFixed(1)}%`
                : '--'
          }
          variant="success"
        />
        <KpiCard
          title="Failed Attestations"
          value={attestationSummary?.total_failed ?? agentAttestation?.failedCount ?? '--'}
          variant="danger"
          subtitle={`in last ${timeRange}`}
        />
        <KpiCard
          title="Active Alerts"
          value={
            alertSummary?.critical != null && alertSummary?.warnings != null
              ? alertSummary.critical + alertSummary.warnings
              : '--'
          }
          variant="warning"
          subtitle={`${alertSummary?.critical ?? 0} critical`}
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
                label={({ cx, cy, midAngle, outerRadius, name, value }: {
                  cx: number; cy: number; midAngle: number; outerRadius: number;
                  name: string; value: number;
                }) => {
                  const RADIAN = Math.PI / 180;
                  const radius = outerRadius + 18;
                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                  const y = cy + radius * Math.sin(-midAngle * RADIAN);
                  const colors = ALERT_COLOR_MAPS[alertChartDimension];
                  return (
                    <text
                      x={x} y={y}
                      fill={colors[name] ?? ALERT_FALLBACK_COLOR}
                      textAnchor={x > cx ? 'start' : 'end'}
                      dominantBaseline="central"
                      fontSize={12}
                      style={{ cursor: 'pointer' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/alerts?${alertChartDimension}=${encodeURIComponent(name)}`);
                      }}
                    >
                      {`${name.replace(/_/g, ' ')} (${value})`}
                    </text>
                  );
                }}
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
        <div className="placeholder">
          <div className="placeholder__icon">&#x1F4CA;</div>
          <div className="placeholder__text">Timeline chart</div>
          <div className="placeholder__subtext">
            A time-series chart showing attestation success/failure rates over the selected time range.
          </div>
        </div>
      </div>
    </div>
  );
}
