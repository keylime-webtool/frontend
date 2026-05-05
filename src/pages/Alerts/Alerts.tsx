import { useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  PieChart, Pie, Cell, Legend, ResponsiveContainer,
} from 'recharts';
import { KpiCard } from '@/components/common/KpiCard';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { alertsApi } from '@/api/alerts';
import { useFormatTimestamp } from '@/store/visualizationStore';
import type { Alert } from '@/types';

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#ea4335',
  warning: '#f9ab00',
  info: '#1a73e8',
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

const STATE_COLORS: Record<string, string> = {
  new: '#ea4335',
  acknowledged: '#f9ab00',
  under_investigation: '#4285f4',
  resolved: '#34a853',
  dismissed: '#9e9e9e',
};

const FALLBACK_COLOR = '#bdbdbd';

function buildChartData(items: Alert[], key: keyof Alert): { name: string; value: number }[] {
  const counts = new Map<string, number>();
  for (const alert of items) {
    const k = String(alert[key] ?? 'unknown');
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
}

function AlertPieChart({
  title,
  data,
  colors,
  dimension,
}: {
  title: string;
  data: { name: string; value: number }[];
  colors: Record<string, string>;
  dimension: string;
}) {
  const navigate = useNavigate();

  if (data.length === 0) {
    return (
      <div className="section" style={{ flex: 1, minWidth: 250 }}>
        <h2 className="section__title">{title}</h2>
        <div className="placeholder">
          <div className="placeholder__icon">&#x25EF;</div>
          <div className="placeholder__text">No data</div>
        </div>
      </div>
    );
  }

  return (
    <div className="section" style={{ flex: 1, minWidth: 250 }}>
      <h2 className="section__title">{title}</h2>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={80}
            innerRadius={40}
            dataKey="value"
            nameKey="name"
            label={({ cx = 0, cy = 0, midAngle = 0, outerRadius = 0, name = '', value = 0 }: {
              cx?: number; cy?: number; midAngle?: number; outerRadius?: number;
              name?: string; value?: number;
            }) => {
              const RADIAN = Math.PI / 180;
              const radius = outerRadius + 16;
              const x = cx + radius * Math.cos(-midAngle * RADIAN);
              const y = cy + radius * Math.sin(-midAngle * RADIAN);
              return (
                <text
                  x={x} y={y}
                  fill={colors[name] ?? FALLBACK_COLOR}
                  textAnchor={x > cx ? 'start' : 'end'}
                  dominantBaseline="central"
                  fontSize={11}
                  style={{ cursor: 'pointer' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/alerts?${dimension}=${encodeURIComponent(name)}`);
                  }}
                >
                  {`${name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())} (${value})`}
                </text>
              );
            }}
            labelLine
            style={{ cursor: 'pointer' }}
            onClick={(_data, index) => {
              const entry = data[index];
              if (entry) {
                navigate(`/alerts?${dimension}=${encodeURIComponent(entry.name)}`);
              }
            }}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={colors[entry.name] ?? FALLBACK_COLOR} />
            ))}
          </Pie>
          <Legend
            formatter={(value: string) => (
              <span style={{ textTransform: 'capitalize', cursor: 'pointer', fontSize: 12 }}>
                {value.replace(/_/g, ' ')}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function Alerts() {
  const fmtTs = useFormatTimestamp();
  const [searchParams, setSearchParams] = useSearchParams();
  const severityFilter = useMemo(() => searchParams.get('severity') ?? '', [searchParams]);
  const stateFilter = useMemo(() => searchParams.get('state') ?? '', [searchParams]);
  const typeFilter = useMemo(() => searchParams.get('type') ?? '', [searchParams]);

  const { data: summary } = useQuery({
    queryKey: ['alerts', 'summary'],
    queryFn: () => alertsApi.summary(),
    select: (res) => res.data,
  });

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['alerts', severityFilter, stateFilter, typeFilter],
    queryFn: () =>
      alertsApi.list({
        severity: severityFilter || undefined,
        state: stateFilter || undefined,
        type: typeFilter || undefined,
      }),
    select: (res) => res.data,
  });

  const alertItems = useMemo(
    () => Array.isArray(alerts?.items) ? alerts.items : Array.isArray(alerts) ? alerts : [],
    [alerts]
  );

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
    {
      key: 'created_timestamp',
      header: 'Created',
      sortable: true,
      render: (row: Alert) => <span>{fmtTs(row.created_timestamp)}</span>,
    },
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
                color: 'var(--color-text)',
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
                color: 'var(--color-text)',
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
          onClick={() => setSearchParams({})}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: 500,
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
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
          onClick={() => setSearchParams({ severity: 'critical' })}
        />
        <KpiCard
          title="Warnings"
          value={summary?.warnings ?? '--'}
          variant="warning"
          onClick={() => setSearchParams({ severity: 'warning' })}
        />
        <KpiCard
          title="Info"
          value={summary?.info ?? '--'}
          variant="info"
          onClick={() => setSearchParams({ severity: 'info' })}
        />
      </div>

      <div className="section" style={{ display: 'flex', gap: '12px', padding: '12px 20px' }}>
        <select
          value={severityFilter}
          onChange={(e) => {
            const next = new URLSearchParams(searchParams);
            if (e.target.value) { next.set('severity', e.target.value); } else { next.delete('severity'); }
            setSearchParams(next);
          }}
          style={{ padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: '14px', color: 'var(--color-text)', background: 'var(--color-surface)' }}
          aria-label="Filter by severity"
        >
          <option value="">All severities</option>
          <option value="critical">Critical</option>
          <option value="warning">Warning</option>
          <option value="info">Info</option>
        </select>
        <select
          value={stateFilter}
          onChange={(e) => {
            const next = new URLSearchParams(searchParams);
            if (e.target.value) { next.set('state', e.target.value); } else { next.delete('state'); }
            setSearchParams(next);
          }}
          style={{ padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: '14px', color: 'var(--color-text)', background: 'var(--color-surface)' }}
          aria-label="Filter by state"
        >
          <option value="">All states</option>
          <option value="new">New</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="under_investigation">Investigating</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => {
            const next = new URLSearchParams(searchParams);
            if (e.target.value) { next.set('type', e.target.value); } else { next.delete('type'); }
            setSearchParams(next);
          }}
          style={{ padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: '14px', color: 'var(--color-text)', background: 'var(--color-surface)' }}
          aria-label="Filter by type"
        >
          <option value="">All types</option>
          <option value="attestation_failure">Attestation Failure</option>
          <option value="cert_expiry">Cert Expiry</option>
          <option value="policy_violation">Policy Violation</option>
          <option value="pcr_change">PCR Change</option>
          <option value="service_down">Service Down</option>
          <option value="rate_limit">Rate Limit</option>
          <option value="clock_skew">Clock Skew</option>
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

      <div className="charts-row" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '24px' }}>
        <AlertPieChart
          title="By Severity"
          data={buildChartData(alertItems, 'severity')}
          colors={SEVERITY_COLORS}
          dimension="severity"
        />
        <AlertPieChart
          title="By Type"
          data={buildChartData(alertItems, 'type')}
          colors={TYPE_COLORS}
          dimension="type"
        />
        <AlertPieChart
          title="By State"
          data={buildChartData(alertItems, 'state')}
          colors={STATE_COLORS}
          dimension="state"
        />
      </div>
    </div>
  );
}
