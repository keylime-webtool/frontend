import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { policiesApi } from '@/api/policies';
import type { Policy } from '@/types';

const KIND_LABELS: Record<string, string> = {
  ima: 'IMA',
  measured_boot: 'Measured Boot',
};

export function Policies() {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['policies', search],
    queryFn: () => policiesApi.list({ search: search || undefined }),
    select: (res) => res.data,
  });

  const columns = [
    { key: 'name', header: 'Name', sortable: true },
    {
      key: 'kind',
      header: 'Type',
      sortable: true,
      render: (row: Policy) => (
        <StatusBadge label={KIND_LABELS[row.kind] ?? row.kind ?? '--'} variant="info" />
      ),
    },
    { key: 'assigned_agents', header: 'Agents', sortable: true },
    { key: 'checksum', header: 'Checksum', render: (row: Policy) => (
      <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
        {row.checksum ? `${row.checksum.substring(0, 12)}...` : '--'}
      </span>
    )},
    {
      key: 'approval_state',
      header: 'Status',
      sortable: true,
      render: (row: Policy) => <StatusBadge label={row.approval_state ?? 'unknown'} />,
    },
    { key: 'updated_date', header: 'Last Updated', sortable: true },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title">Policies</h1>
        <p className="page-header__subtitle">
          Manage IMA and Measured Boot policies with versioning and two-person approval
        </p>
      </div>

      <div className="section" style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '12px 20px' }}>
        <input
          type="search"
          placeholder="Search policies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            padding: '8px 12px',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '14px',
          }}
          aria-label="Search policies"
        />
        <button
          style={{
            padding: '8px 20px',
            background: 'var(--color-primary)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          New Policy
        </button>
        <button
          style={{
            padding: '8px 20px',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '14px',
          }}
        >
          Import
        </button>
      </div>

      {isLoading ? (
        <div className="placeholder">
          <div className="placeholder__text">Loading policies...</div>
        </div>
      ) : (
        <DataTable<Policy>
          columns={columns}
          data={Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : []}
          keyField="id"
        />
      )}

      <div className="section" style={{ marginTop: '24px' }}>
        <h2 className="section__title">Policy Approval Workflow</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', padding: '20px' }}>
          {['Draft', 'Impact Analysis', 'Pending Approval', 'Approved', 'Applied'].map((step, i) => (
            <span key={step}>
              <span style={{
                padding: '6px 16px',
                borderRadius: 'var(--radius-sm)',
                background: i === 0 ? 'var(--color-primary)' : 'var(--color-bg)',
                color: i === 0 ? 'white' : 'var(--color-text-secondary)',
                fontSize: '13px',
                fontWeight: 500,
              }}>
                {step}
              </span>
              {i < 4 && <span style={{ margin: '0 4px', color: 'var(--color-text-secondary)' }}>&rarr;</span>}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
