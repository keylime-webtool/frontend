import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { KpiCard } from '@/components/common/KpiCard';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { alertsApi } from '@/api/alerts';
import { useFormatTimestamp } from '@/store/visualizationStore';
import type { Alert } from '@/types';

export function Alerts() {
  const fmtTs = useFormatTimestamp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [severityFilter, setSeverityFilter] = useState(searchParams.get('severity') ?? '');
  const [stateFilter, setStateFilter] = useState(searchParams.get('state') ?? '');
  const [typeFilter, setTypeFilter] = useState(searchParams.get('type') ?? '');

  useEffect(() => {
    setSeverityFilter(searchParams.get('severity') ?? '');
    setStateFilter(searchParams.get('state') ?? '');
    setTypeFilter(searchParams.get('type') ?? '');
  }, [searchParams]);

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
          onClick={() => { setSeverityFilter(''); setStateFilter(''); setTypeFilter(''); setSearchParams({}); }}
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
          onChange={(e) => setStateFilter(e.target.value)}
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
          onChange={(e) => setTypeFilter(e.target.value)}
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
    </div>
  );
}
