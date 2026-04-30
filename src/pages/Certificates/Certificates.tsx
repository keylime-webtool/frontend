import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { KpiCard } from '@/components/common/KpiCard';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useFormatTimestamp } from '@/store/visualizationStore';
import { certificatesApi } from '@/api/certificates';
import type { Certificate, CertificateType, ExpiryCategory } from '@/types';

const TYPE_FILTERS: Array<{ label: string; value: CertificateType | '' }> = [
  { label: 'All', value: '' },
  { label: 'EK', value: 'ek' },
  { label: 'AK', value: 'ak' },
  { label: 'mTLS', value: 'mtls' },
];

const EXPIRY_COLORS: Record<ExpiryCategory, string> = {
  valid: '#34a853',
  warning_90d: '#4285f4',
  warning_30d: '#f9ab00',
  critical_7d: '#e8710a',
  critical_1d: '#ea4335',
  expired: '#991b1b',
};

const EXPIRY_LABELS: Record<ExpiryCategory, string> = {
  valid: 'Valid (>90d)',
  warning_90d: 'Info (90d)',
  warning_30d: 'Action (30d)',
  critical_7d: 'Critical (7d)',
  critical_1d: 'Emergency (1d)',
  expired: 'Expired',
};

export function Certificates() {
  const navigate = useNavigate();
  const fmtTs = useFormatTimestamp();
  const [typeFilter, setTypeFilter] = useState<CertificateType | ''>('');

  const { data: summary } = useQuery({
    queryKey: ['certificates', 'expiry-summary'],
    queryFn: () => certificatesApi.expirySummary(),
    select: (res) => res.data,
  });

  const { data: certs, isLoading } = useQuery({
    queryKey: ['certificates', 'list', typeFilter],
    queryFn: () => certificatesApi.list(typeFilter ? { type: typeFilter } : undefined),
    select: (res) => res.data,
  });

  const { data: timeline } = useQuery({
    queryKey: ['certificates', 'timeline'],
    queryFn: () => certificatesApi.timeline(),
    select: (res) => res.data,
  });

  const timelineData = Array.isArray(timeline) ? timeline : [];

  const columns = [
    { key: 'associated_entity', header: 'Agent ID', sortable: true },
    {
      key: 'type',
      header: 'Type',
      sortable: true,
      render: (row: Certificate) => (
        <StatusBadge label={row.type?.toUpperCase() ?? '--'} variant="info" />
      ),
    },
    { key: 'issuer_dn', header: 'Issuer', sortable: true },
    {
      key: 'expiry_category',
      header: 'Status',
      sortable: true,
      render: (row: Certificate) => <StatusBadge label={row.expiry_category ?? 'unknown'} />,
    },
    {
      key: 'not_after',
      header: 'Expiry Date',
      sortable: true,
      render: (row: Certificate) => (
        <span style={{ fontFamily: 'monospace', fontSize: '13px' }}>
          {row.not_after ? fmtTs(row.not_after) : '--'}
        </span>
      ),
    },
  ];

  const certRows = Array.isArray(certs?.items) ? certs.items : Array.isArray(certs) ? certs : [];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title">Certificates</h1>
        <p className="page-header__subtitle">Monitor certificate lifecycle and prevent expiry outages</p>
      </div>

      <div className="kpi-grid">
        <KpiCard title="Expired" value={summary?.expired ?? '--'} variant="danger" />
        <KpiCard title="Expiring < 30d" value={summary?.expiring_30d ?? '--'} variant="warning" />
        <KpiCard title="Expiring < 90d" value={summary?.expiring_90d ?? '--'} variant="info" />
        <KpiCard title="Valid" value={summary?.valid ?? '--'} variant="success" />
        <KpiCard title="Total" value={summary?.total ?? '--'} />
      </div>

      <div className="section">
        <h2 className="section__title">90-Day Expiry Timeline</h2>
        {timelineData.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" fontSize={11} tick={{ fill: 'var(--color-text-secondary)' }} />
                <YAxis fontSize={11} tick={{ fill: 'var(--color-text-secondary)' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--color-text)',
                  }}
                  formatter={(value, _name, item) => {
                    const cat = (item.payload as Record<string, unknown>)?.expiry_category as ExpiryCategory | undefined;
                    return [String(value), EXPIRY_LABELS[cat!] ?? cat ?? ''];
                  }}
                />
                <Bar dataKey="count" name="Certificates" radius={[2, 2, 0, 0]}>
                  {timelineData.map((entry, index) => (
                    <Cell key={index} fill={EXPIRY_COLORS[entry.expiry_category] ?? '#6b7280'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="timeline-legend" role="list" aria-label="Timeline color legend">
              {(Object.keys(EXPIRY_COLORS) as ExpiryCategory[]).map((cat) => (
                <div key={cat} className="timeline-legend__item" role="listitem">
                  <span
                    className="timeline-legend__swatch"
                    style={{ background: EXPIRY_COLORS[cat] }}
                    aria-hidden="true"
                  />
                  <span>{EXPIRY_LABELS[cat]}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="placeholder">
            <div className="placeholder__icon">&#x1F4C5;</div>
            <div className="placeholder__text">No timeline data available</div>
            <div className="placeholder__subtext">
              Certificate expirations will be plotted on a 90-day timeline once data is available.
            </div>
          </div>
        )}
      </div>

      <div className="filter-bar">
        <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
          Filter by type:
        </span>
        <div className="filter-bar__group" role="group" aria-label="Certificate type filter">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.value}
              className={`filter-bar__btn${typeFilter === f.value ? ' filter-bar__btn--active' : ''}`}
              onClick={() => setTypeFilter(f.value)}
              aria-pressed={typeFilter === f.value}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="placeholder">
          <div className="placeholder__text">Loading certificates...</div>
        </div>
      ) : (
        <DataTable<Certificate>
          columns={columns}
          data={certRows}
          keyField="id"
          onRowClick={(row) => navigate(`/certificates/${row.id}`)}
        />
      )}
    </div>
  );
}
