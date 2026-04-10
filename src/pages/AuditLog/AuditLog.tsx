import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { auditApi } from '@/api/audit';
import type { AuditLogEntry } from '@/types';

export function AuditLog() {
  const [severity, setSeverity] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['audit-log', severity],
    queryFn: () => auditApi.list({ severity: severity || undefined }),
    select: (res) => res.data,
  });

  const { data: chainStatus } = useQuery({
    queryKey: ['audit-log', 'chain-status'],
    queryFn: () => auditApi.verifyChain(),
    select: (res) => res.data,
  });

  const columns = [
    { key: 'timestamp', header: 'Timestamp', sortable: true },
    {
      key: 'severity',
      header: 'Severity',
      sortable: true,
      render: (row: AuditLogEntry) => <StatusBadge label={row.severity} />,
    },
    {
      key: 'action',
      header: 'Action',
      sortable: true,
      render: (row: AuditLogEntry) => (
        <span style={{ textTransform: 'capitalize' }}>
          {(row.action ?? '').replace(/_/g, ' ')}
        </span>
      ),
    },
    { key: 'actor', header: 'Actor', sortable: true },
    { key: 'resource_type', header: 'Resource', sortable: true },
    {
      key: 'result',
      header: 'Result',
      sortable: true,
      render: (row: AuditLogEntry) => <StatusBadge label={row.result} />,
    },
    { key: 'source_ip', header: 'Source IP' },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title">Audit Log</h1>
        <p className="page-header__subtitle">Tamper-evident security event log with hash chain verification</p>
      </div>

      {chainStatus && (
        <div className="section" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <StatusBadge
            label={chainStatus.verified ? 'Chain Verified' : 'Chain Broken'}
            variant={chainStatus.verified ? 'success' : 'danger'}
          />
          <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            {chainStatus.total_entries} entries &middot; Last verified: {chainStatus.last_verification}
          </span>
        </div>
      )}

      <div className="section" style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '12px 20px' }}>
        <select
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: '14px' }}
          aria-label="Filter by severity"
        >
          <option value="">All severities</option>
          <option value="critical">Critical</option>
          <option value="warning">Warning</option>
          <option value="info">Info</option>
        </select>
        <div style={{ flex: 1 }} />
        <button
          style={{
            padding: '8px 16px',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--color-surface)',
            fontSize: '14px',
          }}
        >
          Export CSV
        </button>
        <button
          style={{
            padding: '8px 16px',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--color-surface)',
            fontSize: '14px',
          }}
        >
          Export JSON
        </button>
      </div>

      {isLoading ? (
        <div className="placeholder">
          <div className="placeholder__text">Loading audit log...</div>
        </div>
      ) : (
        <DataTable<AuditLogEntry>
          columns={columns}
          data={Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []}
          keyField="id"
        />
      )}
    </div>
  );
}
