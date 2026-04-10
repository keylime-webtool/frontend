import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { agentsApi } from '@/api/agents';
import type { AgentState } from '@/types';

interface AgentRow {
  id: string;
  ip: string;
  state: string;
  attestation_mode: string;
  last_attestation: string | null;
  assigned_policy: string;
  failure_count: number;
  [key: string]: unknown;
}

export function AgentList() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [stateFilter, setStateFilter] = useState<AgentState | ''>('');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['agents', page, stateFilter, search],
    queryFn: () =>
      agentsApi.list({
        page,
        per_page: 25,
        state: stateFilter || undefined,
        search: search || undefined,
      }),
    select: (res) => res.data,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawItems = (data as any)?.items ?? data;
  const items: AgentRow[] = Array.isArray(rawItems) ? rawItems : [];
  const totalPages = data?.total_pages ?? 1;

  const columns = [
    { key: 'id', header: 'Agent ID', sortable: true },
    { key: 'ip', header: 'IP Address', sortable: true },
    {
      key: 'state',
      header: 'State',
      sortable: true,
      render: (row: AgentRow) => <StatusBadge label={row.state} />,
    },
    { key: 'attestation_mode', header: 'Mode', sortable: true },
    { key: 'assigned_policy', header: 'Policy', sortable: true },
    {
      key: 'last_attestation',
      header: 'Last Attestation',
      sortable: true,
      render: (row: AgentRow) => <span>{row.last_attestation ?? '--'}</span>,
    },
    { key: 'failure_count', header: 'Failures', sortable: true },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title">Agents</h1>
        <p className="page-header__subtitle">Manage and monitor Keylime agents across your fleet</p>
      </div>

      <div className="section" style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '12px 20px' }}>
        <input
          type="search"
          placeholder="Search by UUID, hostname, or IP..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{
            flex: 1,
            padding: '8px 12px',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '14px',
          }}
          aria-label="Search agents"
        />
        <select
          value={stateFilter}
          onChange={(e) => { setStateFilter(e.target.value as AgentState | ''); setPage(1); }}
          style={{
            padding: '8px 12px',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '14px',
          }}
          aria-label="Filter by state"
        >
          <option value="">All states</option>
          <option value="get_quote">Get Quote</option>
          <option value="failed">Failed</option>
          <option value="retry">Retry</option>
          <option value="registered">Registered</option>
          <option value="terminated">Terminated</option>
        </select>
      </div>

      {isLoading ? (
        <div className="placeholder">
          <div className="placeholder__text">Loading agents...</div>
        </div>
      ) : (
        <>
          <DataTable<AgentRow>
            columns={columns}
            data={items}
            keyField="id"
            onRowClick={(row) => navigate(`/agents/${row.id}`)}
            selectable
          />
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                style={{ padding: '6px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}
              >
                Previous
              </button>
              <span style={{ padding: '6px 12px', fontSize: '14px' }}>
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                style={{ padding: '6px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
