import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useFormatTimestamp } from '@/store/visualizationStore';
import { certificatesApi } from '@/api/certificates';
import type { Certificate } from '@/types';

const TYPE_LABELS: Record<string, string> = {
  ek: 'EK Certificate',
  ak: 'AK Certificate',
  mtls: 'mTLS Certificate',
};

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function CertificateDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fmtTs = useFormatTimestamp();

  const { data: cert, isLoading } = useQuery({
    queryKey: ['certificates', 'detail', id],
    queryFn: () => certificatesApi.get(id!),
    select: (res) => res.data as Certificate,
    enabled: !!id,
  });

  const handleDownload = async (format: 'pem' | 'der') => {
    if (!id) return;
    const response = format === 'pem'
      ? await certificatesApi.downloadPem(id)
      : await certificatesApi.downloadDer(id);
    const blob = response.data as Blob;
    triggerDownload(blob, `${cert?.serial_number ?? id}.${format}`);
  };

  if (isLoading) {
    return (
      <div className="placeholder">
        <div className="placeholder__text">Loading certificate details...</div>
      </div>
    );
  }

  if (!cert) {
    return (
      <div className="placeholder">
        <div className="placeholder__text">Certificate not found</div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={() => navigate('/certificates')}
          style={{
            background: 'none',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '6px 12px',
            fontSize: '14px',
            color: 'var(--color-text)',
            cursor: 'pointer',
          }}
          aria-label="Back to certificates list"
        >
          &larr; Back
        </button>
        <div>
          <h1 className="page-header__title" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span>{TYPE_LABELS[cert.type] ?? cert.type.toUpperCase()}</span>
            <StatusBadge label={cert.type.toUpperCase()} variant="info" />
            <StatusBadge label={cert.validation_status} />
          </h1>
          <p className="page-header__subtitle">{cert.subject_dn}</p>
        </div>
      </div>

      <div className="section">
        <h2 className="section__title">Certificate Details</h2>
        <div className="cert-detail__grid">
          <div>
            <div className="cert-detail__field">
              <div className="cert-detail__label">Subject DN</div>
              <div className="cert-detail__value cert-detail__value--mono">{cert.subject_dn}</div>
            </div>
            <div className="cert-detail__field">
              <div className="cert-detail__label">Issuer DN</div>
              <div className="cert-detail__value cert-detail__value--mono">{cert.issuer_dn}</div>
            </div>
            <div className="cert-detail__field">
              <div className="cert-detail__label">Serial Number</div>
              <div className="cert-detail__value cert-detail__value--mono">{cert.serial_number}</div>
            </div>
            <div className="cert-detail__field">
              <div className="cert-detail__label">Validity Period</div>
              <div className="cert-detail__value">
                {fmtTs(cert.not_before)} &mdash; {fmtTs(cert.not_after)}
              </div>
            </div>
            <div className="cert-detail__field">
              <div className="cert-detail__label">Expiry Status</div>
              <div className="cert-detail__value">
                <StatusBadge label={cert.expiry_category} />
              </div>
            </div>
          </div>
          <div>
            <div className="cert-detail__field">
              <div className="cert-detail__label">Public Key Algorithm</div>
              <div className="cert-detail__value">{cert.public_key_algorithm}</div>
            </div>
            <div className="cert-detail__field">
              <div className="cert-detail__label">Public Key Size</div>
              <div className="cert-detail__value">{cert.public_key_size} bits</div>
            </div>
            <div className="cert-detail__field">
              <div className="cert-detail__label">Signature Algorithm</div>
              <div className="cert-detail__value">{cert.signature_algorithm}</div>
            </div>
            <div className="cert-detail__field">
              <div className="cert-detail__label">Agent</div>
              <div className="cert-detail__value cert-detail__value--mono">{cert.associated_entity}</div>
            </div>
          </div>
        </div>
      </div>

      {cert.san.length > 0 && (
        <div className="section">
          <h2 className="section__title">Subject Alternative Names</h2>
          <div className="cert-detail__tags">
            {cert.san.map((s) => (
              <StatusBadge key={s} label={s} variant="neutral" />
            ))}
          </div>
        </div>
      )}

      {cert.key_usage.length > 0 && (
        <div className="section">
          <h2 className="section__title">Key Usage</h2>
          <div className="cert-detail__tags">
            {cert.key_usage.map((ku) => (
              <StatusBadge key={ku} label={ku} variant="info" />
            ))}
          </div>
        </div>
      )}

      {cert.extended_key_usage.length > 0 && (
        <div className="section">
          <h2 className="section__title">Extended Key Usage</h2>
          <div className="cert-detail__tags">
            {cert.extended_key_usage.map((eku) => (
              <StatusBadge key={eku} label={eku} variant="info" />
            ))}
          </div>
        </div>
      )}

      {cert.chain.length > 0 && (
        <div className="section">
          <h2 className="section__title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            Certificate Chain
            {cert.chain_valid !== null && (
              <StatusBadge
                label={cert.chain_valid ? 'chain valid' : 'chain invalid'}
                variant={cert.chain_valid ? 'success' : 'danger'}
              />
            )}
          </h2>
          <div className="cert-chain">
            <div className={`cert-chain__item cert-chain__item--${cert.validation_status === 'valid' ? 'valid' : 'invalid'}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <strong style={{ fontSize: '13px', color: 'var(--color-text)' }}>Leaf Certificate</strong>
                <StatusBadge label={cert.validation_status} />
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>
                {cert.subject_dn}
              </div>
            </div>
            {cert.chain.map((chainCert, idx) => (
              <div key={chainCert.id ?? idx}>
                <div className="cert-chain__connector" />
                <div className={`cert-chain__item cert-chain__item--${chainCert.validation_status === 'valid' ? 'valid' : 'invalid'}`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '13px', color: 'var(--color-text)' }}>
                      {idx === cert.chain.length - 1 ? 'Root CA' : `Intermediate CA ${idx + 1}`}
                    </strong>
                    <StatusBadge label={chainCert.validation_status} />
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>
                    {chainCert.subject_dn}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                    Issuer: {chainCert.issuer_dn}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="section">
        <h2 className="section__title">Export Certificate</h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => handleDownload('pem')}
            aria-label="Download certificate in PEM format"
            style={{
              padding: '8px 20px',
              fontSize: '14px',
              fontWeight: 500,
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              cursor: 'pointer',
            }}
          >
            Download PEM
          </button>
          <button
            onClick={() => handleDownload('der')}
            aria-label="Download certificate in DER format"
            style={{
              padding: '8px 20px',
              fontSize: '14px',
              fontWeight: 500,
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              cursor: 'pointer',
            }}
          >
            Download DER
          </button>
        </div>
      </div>
    </div>
  );
}
