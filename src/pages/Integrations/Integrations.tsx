import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { StatusBadge } from '@/components/common/StatusBadge';
import { performanceApi } from '@/api/performance';
import { settingsApi } from '@/api/settings';
import type { IntegrationService } from '@/types';

export function Integrations() {
  const { data: services, isLoading } = useQuery({
    queryKey: ['integrations', 'status'],
    queryFn: () => performanceApi.integrations(),
    select: (res) => res.data,
    refetchInterval: 1000,
  });

  // Backend health: try fetching the settings endpoint (lightweight).
  // If it responds, backend is up; if it throws, it's down.
  const { data: backendResult, isLoading: backendLoading } = useQuery({
    queryKey: ['integrations', 'backend-health'],
    queryFn: async () => {
      const start = performance.now();
      try {
        await settingsApi.getKeylime();
        return { status: 'up' as const, latency_ms: Math.round(performance.now() - start) };
      } catch {
        return { status: 'down' as const, latency_ms: Math.round(performance.now() - start) };
      }
    },
    refetchInterval: 1000,
  });

  const backendService: IntegrationService | null = useMemo(() => {
    if (!backendResult) return null;
    return {
      name: 'keylime-webtool-backend',
      address: import.meta.env.VITE_API_BASE_URL || window.location.origin,
      status: backendResult.status,
      latency_ms: backendResult.latency_ms,
    };
  }, [backendResult]);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title">Integrations</h1>
        <p className="page-header__subtitle">Backend service connectivity and health monitoring</p>
      </div>

      <div className="section">
        <h2 className="section__title">Webtool Backend</h2>
        {backendLoading ? (
          <div className="placeholder">
            <div className="placeholder__text">Checking backend...</div>
          </div>
        ) : backendService ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            <div
              style={{
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>{backendService.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  {backendService.address}
                </div>
                {backendService.latency_ms !== undefined && (
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                    Latency: {backendService.latency_ms}ms
                  </div>
                )}
              </div>
              <StatusBadge label={backendService.status} />
            </div>
          </div>
        ) : null}
      </div>

      <div className="section">
        <h2 className="section__title">Core Services</h2>
        {isLoading ? (
          <div className="placeholder">
            <div className="placeholder__text">Loading service status...</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            {(Array.isArray(services) ? services : []).map((svc: IntegrationService) => (
              <div
                key={svc.name}
                style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>{svc.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                    {svc.address}
                  </div>
                  {svc.latency_ms !== undefined && (
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      Latency: {svc.latency_ms}ms
                    </div>
                  )}
                </div>
                <StatusBadge label={svc.status} />
              </div>
            ))}
            {(!Array.isArray(services) || services.length === 0) && (
              <div className="placeholder">
                <div className="placeholder__icon">&#x1F517;</div>
                <div className="placeholder__text">No services configured</div>
                <div className="placeholder__subtext">
                  Service status for Verifier, Registrar, TimescaleDB, Redis, and SIEM integrations.
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="section">
          <h2 className="section__title">Attestation Backends</h2>
          <div className="placeholder">
            <div className="placeholder__icon">&#x1F4E6;</div>
            <div className="placeholder__text">Durable backends</div>
            <div className="placeholder__subtext">
              Rekor, Redis, and RFC 3161 TSA status with connection state and latency.
            </div>
          </div>
        </div>

        <div className="section">
          <h2 className="section__title">Notification Channels</h2>
          <div className="placeholder">
            <div className="placeholder__icon">&#x1F514;</div>
            <div className="placeholder__text">Notification delivery</div>
            <div className="placeholder__subtext">
              ZeroMQ, Webhook, and Agent notification channel status.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
