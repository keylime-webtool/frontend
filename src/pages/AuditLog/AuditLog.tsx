import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge, type BadgeVariant } from '@/components/common/StatusBadge';
import { auditApi, type AuditExportFile, type AuditExportFormat } from '@/api/audit';
import { useFormatTimestamp } from '@/store/visualizationStore';
import { humanizeLabel } from '@/utils/humanize';
import type { AuditLogEntry } from '@/types';

function resultBadgeVariant(result: string): BadgeVariant {
  const normalized = result.toLowerCase();
  if (normalized.startsWith('success')) return 'success';
  if (/(unreachable|denied|error|fail)/.test(normalized)) return 'danger';
  if (/(acknowledged|resolved)/.test(normalized)) return 'info';
  return 'neutral';
}

function triggerDownload({ blob, filename }: AuditExportFile) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function AuditLog() {
  const fmtTs = useFormatTimestamp();
  const [severity, setSeverity] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['audit-log', severity],
    queryFn: () => auditApi.list({ severity: severity || undefined }),
    select: (res) => res.data,
  });

  const { data: chainStatus, dataUpdatedAt: chainCheckedAt } = useQuery({
    queryKey: ['audit-log', 'chain-status'],
    queryFn: () => auditApi.verifyChain(),
  });

  const handleExport = async (format: AuditExportFormat) => {
    const file = await auditApi.export(format, { severity: severity || undefined });
    triggerDownload(file);
  };

  const columns = [
    {
      key: 'timestamp',
      header: 'Timestamp',
      sortable: true,
      render: (row: AuditLogEntry) => <span>{fmtTs(row.timestamp)}</span>,
    },
    {
      key: 'severity',
      header: 'Severity',
      sortable: true,
      render: (row: AuditLogEntry) => <StatusBadge label={row.severity.toLowerCase()} />,
    },
    {
      key: 'action',
      header: 'Action',
      sortable: true,
      render: (row: AuditLogEntry) => humanizeLabel(row.action),
    },
    { key: 'actor', header: 'Actor', sortable: true },
    { key: 'resource', header: 'Resource', sortable: true },
    {
      key: 'result',
      header: 'Result',
      sortable: true,
      render: (row: AuditLogEntry) => (
        <StatusBadge label={row.result} variant={resultBadgeVariant(row.result)} />
      ),
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
            {chainStatus.total_entries} entries &middot; Last checked: {fmtTs(chainCheckedAt)}
          </span>
          {!chainStatus.verified && chainStatus.reason && (
            <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
              Broken at entry #{chainStatus.broken_entry_id}: {chainStatus.reason}
            </span>
          )}
        </div>
      )}

      <div className="section" style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '12px 20px' }}>
        <select
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: '14px', color: 'var(--color-text)', background: 'var(--color-surface)' }}
          aria-label="Filter by severity"
        >
          <option value="">All severities</option>
          <option value="critical">Critical</option>
          <option value="warning">Warning</option>
          <option value="info">Info</option>
        </select>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => handleExport('csv')}
          style={{
            padding: '8px 16px',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            fontSize: '14px',
          }}
        >
          Export CSV
        </button>
        <button
          onClick={() => handleExport('json')}
          style={{
            padding: '8px 16px',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
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
          data={Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : []}
          keyField="id"
        />
      )}
    </div>
  );
}
