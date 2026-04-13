import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { KpiCard } from '@/components/common/KpiCard';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { alertsApi } from '@/api/alerts';
import type { Alert } from '@/types';

type ChartDimension = 'severity' | 'type' | 'state';

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#ea4335',
  warning: '#f9ab00',
  info: '#1a73e8',
};

const STATE_COLORS: Record<string, string> = {
  new: '#ea4335',
  acknowledged: '#f9ab00',
  under_investigation: '#4285f4',
  resolved: '#34a853',
  dismissed: '#9e9e9e',
};

const TYPE_COLORS: Record<string, string> = {
  attestation_failure: '#ea4335',
  cert_expiry: '#f9ab00',
  policy_violation: '#e8710a',
  pcr_change: '#9334e6',
  service_down: '#d93025',
  rate_limit: '#4285f4',
  clock_skew: '#00897b',
};

const COLOR_MAPS: Record<ChartDimension, Record<string, string>> = {
  severity: SEVERITY_COLORS,
  type: TYPE_COLORS,
  state: STATE_COLORS,
};

const FALLBACK_COLOR = '#bdbdbd';

export function Alerts() {
  const [severityFilter, setSeverityFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [chartDimension, setChartDimension] = useState<ChartDimension>('severity');

  const { data: summary } = useQuery({
    queryKey: ['alerts', 'summary'],
    queryFn: () => alertsApi.summary(),
    select: (res) => res.data,
  });

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['alerts', severityFilter, stateFilter],
    queryFn: () =>
      alertsApi.list({
        severity: severityFilter || undefined,
        state: stateFilter || undefined,
      }),
    select: (res) => res.data,
  });

  const alertItems = useMemo(
    () => Array.isArray(alerts?.items) ? alerts.items : Array.isArray(alerts) ? alerts : [],
    [alerts]
  );

  const chartData = useMemo(() => {
    const counts = new Map<string, number>();
    for (const alert of alertItems) {
      const key = alert[chartDimension] ?? 'unknown';
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
  }, [alertItems, chartDimension]);

  const columns = [
    {
      key: 'severity',
      header: 'Severity',
      sortable: true,
      render: (row: Alert) => <StatusBadge label={row.severity} />,
    },
    {
      key: 'type',
      header: 'Type',
      sortable: true,
      render: (row: Alert) => (
        <span style={{ textTransform: 'capitalize' }}>
          {(row.type ?? '').replace(/_/g, ' ')}
        </span>
      ),
    },
    { key: 'description', header: 'Description' },
    {
      key: 'affected_agents',
      header: 'Agents',
      render: (row: Alert) => row.affected_agents?.length ?? 0,
    },
    {
      key: 'state',
      header: 'State',
      sortable: true,
      render: (row: Alert) => <StatusBadge label={row.state} />,
    },
    { key: 'created_timestamp', header: 'Created', sortable: true },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: Alert) => (
        <div style={{ display: 'flex', gap: '4px' }}>
          {row.state === 'new' && (
            <button
              style={{
                padding: '4px 8px',
                fontSize: '11px',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-surface)',
              }}
            >
              Ack
            </button>
          )}
          {(row.state === 'new' || row.state === 'acknowledged') && (
            <button
              style={{
                padding: '4px 8px',
                fontSize: '11px',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-surface)',
              }}
            >
              Investigate
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-header__title">Alert Center</h1>
          <p className="page-header__subtitle">
            Monitor and manage security alerts with lifecycle tracking
          </p>
        </div>
        <button
          onClick={() => { setSeverityFilter(''); setStateFilter(''); }}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: 500,
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--color-surface)',
            cursor: 'pointer',
          }}
        >
          Show All Alerts
        </button>
      </div>

      <div className="kpi-grid">
        <KpiCard
          title="Critical"
          value={summary?.critical ?? '--'}
          variant="danger"
          onClick={() => { setSeverityFilter('critical'); setStateFilter(''); }}
        />
        <KpiCard
          title="Warnings"
          value={summary?.warnings ?? '--'}
          variant="warning"
          onClick={() => { setSeverityFilter('warning'); setStateFilter(''); }}
        />
        <KpiCard
          title="Info"
          value={summary?.info ?? '--'}
          variant="info"
          onClick={() => { setSeverityFilter('info'); setStateFilter(''); }}
        />
        <KpiCard
          title="Resolved"
          value={summary?.resolved_24h ?? '--'}
          variant="success"
          onClick={() => { setStateFilter('resolved'); setSeverityFilter(''); }}
        />
      </div>

      <div className="section" style={{ display: 'flex', gap: '12px', padding: '12px 20px' }}>
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: '14px' }}
          aria-label="Filter by severity"
        >
          <option value="">All severities</option>
          <option value="critical">Critical</option>
          <option value="warning">Warning</option>
          <option value="info">Info</option>
        </select>
        <select
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: '14px' }}
          aria-label="Filter by state"
        >
          <option value="">All states</option>
          <option value="new">New</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="under_investigation">Investigating</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </select>
      </div>

      {isLoading ? (
        <div className="placeholder">
          <div className="placeholder__text">Loading alerts...</div>
        </div>
      ) : (
        <DataTable<Alert>
          columns={columns}
          data={alertItems}
          keyField="id"
        />
      )}

      <div className="section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 className="section__title" style={{ margin: 0 }}>Alert Distribution</h2>
          <div role="group" aria-label="Chart dimension" style={{ display: 'flex', gap: '4px' }}>
            {(['severity', 'type', 'state'] as ChartDimension[]).map((dim) => (
              <button
                key={dim}
                onClick={() => setChartDimension(dim)}
                style={{
                  padding: '6px 14px',
                  fontSize: '13px',
                  fontWeight: chartDimension === dim ? 600 : 400,
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  background: chartDimension === dim ? 'var(--color-primary)' : 'var(--color-surface)',
                  color: chartDimension === dim ? '#fff' : 'inherit',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {dim}
              </button>
            ))}
          </div>
        </div>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={chartData}
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
                  const colors = COLOR_MAPS[chartDimension];
                  return (
                    <text
                      x={x} y={y}
                      fill={colors[name] ?? FALLBACK_COLOR}
                      textAnchor={x > cx ? 'start' : 'end'}
                      dominantBaseline="central"
                      fontSize={12}
                    >
                      {`${name.replace(/_/g, ' ')} (${value})`}
                    </text>
                  );
                }}
                labelLine
                style={{ cursor: 'pointer' }}
                onClick={(_data, index) => {
                  const entry = chartData[index];
                  if (!entry) return;
                  if (chartDimension === 'severity') {
                    setSeverityFilter(entry.name); setStateFilter('');
                  } else if (chartDimension === 'state') {
                    setStateFilter(entry.name); setSeverityFilter('');
                  }
                }}
              >
                {chartData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={COLOR_MAPS[chartDimension][entry.name] ?? FALLBACK_COLOR}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [
                  `${value} alert${value !== 1 ? 's' : ''}`,
                  name.replace(/_/g, ' '),
                ]}
              />
              <Legend
                formatter={(value: string) => (
                  <span style={{ textTransform: 'capitalize', cursor: 'pointer' }}>
                    {value.replace(/_/g, ' ')}
                  </span>
                )}
                onClick={(e) => {
                  const name = String(e.value);
                  if (chartDimension === 'severity') {
                    setSeverityFilter(name); setStateFilter('');
                  } else if (chartDimension === 'state') {
                    setStateFilter(name); setSeverityFilter('');
                  }
                }}
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
  );
}
