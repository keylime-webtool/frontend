import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { KpiCard } from '@/components/common/KpiCard';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { alertsApi } from '@/api/alerts';
import type { Alert } from '@/types';

export function Alerts() {
  const [severityFilter, setSeverityFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');

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
      <div className="page-header">
        <h1 className="page-header__title">Alert Center</h1>
        <p className="page-header__subtitle">
          Monitor and manage security alerts with lifecycle tracking
        </p>
      </div>

      <div className="kpi-grid">
        <KpiCard title="Critical" value={summary?.critical ?? '--'} variant="danger" />
        <KpiCard title="Warnings" value={summary?.warnings ?? '--'} variant="warning" />
        <KpiCard title="Resolved (24h)" value={summary?.resolved_24h ?? '--'} variant="success" />
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
          data={Array.isArray(alerts?.data) ? alerts.data : Array.isArray(alerts) ? alerts : []}
          keyField="id"
        />
      )}
    </div>
  );
}
