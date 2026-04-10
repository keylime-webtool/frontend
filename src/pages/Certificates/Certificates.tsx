import { useQuery } from '@tanstack/react-query';
import { KpiCard } from '@/components/common/KpiCard';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { certificatesApi } from '@/api/certificates';
import type { Certificate } from '@/types';

export function Certificates() {
  const { data: summary } = useQuery({
    queryKey: ['certificates', 'expiry-summary'],
    queryFn: () => certificatesApi.expirySummary(),
    select: (res) => res.data,
  });

  const { data: certs, isLoading } = useQuery({
    queryKey: ['certificates', 'list'],
    queryFn: () => certificatesApi.list(),
    select: (res) => res.data,
  });

  const columns = [
    { key: 'associated_entity', header: 'Entity', sortable: true },
    {
      key: 'type',
      header: 'Type',
      sortable: true,
      render: (row: Certificate) => (
        <StatusBadge label={row.type?.toUpperCase() ?? '--'} variant="info" />
      ),
    },
    { key: 'subject_dn', header: 'Subject DN', sortable: true },
    { key: 'not_after', header: 'Expires', sortable: true },
    {
      key: 'expiry_category',
      header: 'Status',
      sortable: true,
      render: (row: Certificate) => <StatusBadge label={row.expiry_category ?? 'unknown'} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: () => (
        <button
          style={{
            padding: '4px 12px',
            fontSize: '12px',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--color-surface)',
          }}
        >
          View
        </button>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title">Certificates</h1>
        <p className="page-header__subtitle">Monitor certificate lifecycle and prevent expiry outages</p>
      </div>

      <div className="kpi-grid">
        <KpiCard title="Expired" value={summary?.expired ?? '--'} variant="danger" />
        <KpiCard title="Expiring < 30d" value={summary?.expiring_30d ?? '--'} variant="warning" />
        <KpiCard title="Valid" value={summary?.valid ?? '--'} variant="success" />
        <KpiCard title="Total" value={summary?.total ?? '--'} />
      </div>

      <div className="section">
        <h2 className="section__title">90-Day Expiry Timeline</h2>
        <div className="placeholder">
          <div className="placeholder__icon">&#x1F4C5;</div>
          <div className="placeholder__text">Expiry forecast timeline</div>
          <div className="placeholder__subtext">
            Certificate expirations plotted on a 90-day timeline with tiered severity coloring.
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="placeholder">
          <div className="placeholder__text">Loading certificates...</div>
        </div>
      ) : (
        <DataTable<Certificate>
          columns={columns}
          data={Array.isArray(certs?.items) ? certs.items : Array.isArray(certs) ? certs : []}
          keyField="id"
          selectable
        />
      )}
    </div>
  );
}
