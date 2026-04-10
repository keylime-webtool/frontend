import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { agentsApi } from '@/api/agents';
import type { AgentListParams } from '@/types';


interface AgentRow {
  id: string;
  ip: string;
  state: string;
  attestation_mode: string;
  last_attestation: string | null;
  assigned_policy: string;
  mb_policy: string | null;
  failure_count: number;
  [key: string]: unknown;
}

export function AgentList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [stateFilter, setStateFilter] = useState<string>(searchParams.get('state') ?? '');
  const [search, setSearch] = useState(searchParams.get('q') ?? '');

  // Sync search and state filter when URL query params change
  useEffect(() => {
    const q = searchParams.get('q') ?? '';
    const state = searchParams.get('state') ?? '';
    setSearch(q);
    setStateFilter(state);
    setPage(1);
  }, [searchParams]);

  const isSearchMode = search.trim().length > 0;

  const { data, isLoading } = useQuery({
    queryKey: ['agents', page, stateFilter, search],
    queryFn: async () => {
      if (isSearchMode) {
        const res = await agentsApi.search(search.trim());
        return res.data;
      }
      const res = await agentsApi.list({
        page,
        per_page: 25,
        state: (stateFilter || undefined) as AgentListParams['state'],
      });
      return res.data;
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawItems = (data as any)?.items ?? data;
  const items: AgentRow[] = Array.isArray(rawItems) ? rawItems : [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalPages = (data as any)?.total_pages ?? 1;

  const columns = [
    {
      key: 'id',
      header: 'Agent ID',
      sortable: true,
      render: (row: AgentRow) => (
        <Link to={`/agents/${row.id}`} style={{ fontFamily: 'monospace', fontSize: '13px' }}>
          {row.id}
        </Link>
      ),
    },
    { key: 'ip', header: 'IP Address', sortable: true },
    { key: 'attestation_mode', header: 'Mode', sortable: true },
    {
      key: 'state',
      header: 'State',
      sortable: true,
      render: (row: AgentRow) => <StatusBadge label={row.state} />,
    },
    { key: 'assigned_policy', header: 'IMA Policy', sortable: true },
    {
      key: 'mb_policy',
      header: 'MB Policy',
      sortable: true,
      render: (row: AgentRow) => <span>{row.mb_policy ?? '--'}</span>,
    },
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
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
            if (e.target.value) {
              setSearchParams({ q: e.target.value });
            } else {
              setSearchParams({});
            }
          }}
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
          onChange={(e) => {
            const val = e.target.value;
            setStateFilter(val);
            setPage(1);
            const next = new URLSearchParams(searchParams);
            if (val) {
              next.set('state', val);
            } else {
              next.delete('state');
            }
            setSearchParams(next);
          }}
          style={{
            padding: '8px 12px',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '14px',
          }}
          aria-label="Filter by state"
        >
          <option value="">All states</option>
          <optgroup label="Pull Mode">
            <option value="GET_QUOTE">Get Quote</option>
            <option value="PROVIDE_V">Provide V</option>
            <option value="REGISTERED">Registered</option>
            <option value="FAILED">Failed</option>
            <option value="RETRY">Retry</option>
            <option value="TERMINATED">Terminated</option>
            <option value="INVALID_QUOTE">Invalid Quote</option>
            <option value="TENANT_FAILED">Tenant Failed</option>
          </optgroup>
          <optgroup label="Push Mode">
            <option value="PASS">Pass</option>
            <option value="FAIL">Fail</option>
            <option value="PENDING">Pending</option>
          </optgroup>
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
