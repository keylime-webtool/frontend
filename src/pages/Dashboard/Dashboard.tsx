import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { KpiCard } from '@/components/common/KpiCard';
import { attestationsApi } from '@/api/attestations';
import { agentsApi } from '@/api/agents';
import { alertsApi } from '@/api/alerts';
import { useOutletContext, useNavigate } from 'react-router-dom';

const STATE_COLORS: Record<string, string> = {
  // Pull-mode states
  GET_QUOTE: '#34a853',
  PROVIDE_V: '#4285f4',
  REGISTERED: '#a0c4ff',
  FAILED: '#ea4335',
  RETRY: '#f9ab00',
  TERMINATED: '#9e9e9e',
  INVALID_QUOTE: '#d93025',
  TENANT_FAILED: '#c62828',
  // Push-mode states
  PASS: '#34a853',
  FAIL: '#ea4335',
  PENDING: '#f9ab00',
  UNKNOWN: '#bdbdbd',
};

interface StateEntry {
  name: string;
  state: string;
  mode: string;
  value: number;
}

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

  const agentItems = useMemo(
    () => Array.isArray(agents?.items) ? agents.items : Array.isArray(agents) ? agents : [],
    [agents]
  );

  const stateDistribution: StateEntry[] = useMemo(() => {
    const map = new Map<string, { state: string; mode: string; count: number }>();
    for (const agent of agentItems) {
      const state = agent.state ?? 'UNKNOWN';
      const mode = agent.attestation_mode ?? 'Unknown';
      if (!map.has(state)) {
        map.set(state, { state, mode, count: 0 });
      }
      map.get(state)!.count += 1;
    }
    return Array.from(map.values()).map(({ state, mode, count }) => ({
      name: `${state} (${mode})`,
      state,
      mode,
      value: count,
    }));
  }, [agentItems]);

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
              : '--'
          }
          variant="success"
        />
        <KpiCard
          title="Failed Attestations"
          value={attestationSummary?.total_failed ?? '--'}
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

      <div className="section">
        <h2 className="section__title">Agent State Distribution</h2>
        {stateDistribution.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stateDistribution}
                cx="50%"
                cy="50%"
                outerRadius={100}
                innerRadius={50}
                dataKey="value"
                nameKey="name"
                label={({ cx, cy, midAngle, outerRadius, name, value, index }: {
                  cx: number; cy: number; midAngle: number; outerRadius: number;
                  name: string; value: number; index: number;
                }) => {
                  const RADIAN = Math.PI / 180;
                  const radius = outerRadius + 20;
                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                  const y = cy + radius * Math.sin(-midAngle * RADIAN);
                  return (
                    <text
                      x={x}
                      y={y}
                      fill={STATE_COLORS[stateDistribution[index]?.state] ?? STATE_COLORS.UNKNOWN}
                      textAnchor={x > cx ? 'start' : 'end'}
                      dominantBaseline="central"
                      fontSize={12}
                      style={{ cursor: 'pointer' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        const entry = stateDistribution[index];
                        if (entry) {
                          navigate(`/agents?state=${encodeURIComponent(entry.state)}`);
                        }
                      }}
                    >
                      {`${name} (${value})`}
                    </text>
                  );
                }}
                labelLine
                style={{ cursor: 'pointer' }}
                onClick={(_data, index) => {
                  const entry = stateDistribution[index];
                  if (entry) {
                    navigate(`/agents?state=${encodeURIComponent(entry.state)}`);
                  }
                }}
              >
                {stateDistribution.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={STATE_COLORS[entry.state] ?? STATE_COLORS.UNKNOWN}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [`${value} agent${value !== 1 ? 's' : ''}`, name]}
              />
              <Legend
                onClick={(e) => {
                  const entry = stateDistribution.find((s) => s.name === e.value);
                  if (entry) {
                    navigate(`/agents?state=${encodeURIComponent(entry.state)}`);
                  }
                }}
                formatter={(value) => <span style={{ cursor: 'pointer' }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="placeholder">
            <div className="placeholder__icon">&#x25EF;</div>
            <div className="placeholder__text">No agents found</div>
          </div>
        )}
      </div>

      <div className="section">
        <h2 className="section__title">Recent Alerts</h2>
        <div className="placeholder">
          <div className="placeholder__icon">&#x26A0;</div>
          <div className="placeholder__text">Alert feed</div>
          <div className="placeholder__subtext">
            Real-time alerts will appear here once connected to the backend.
            Each alert shows severity, affected agents, and recommended actions.
          </div>
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
