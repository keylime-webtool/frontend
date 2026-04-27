import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { IntegrationService, ServiceStatus } from '@/types';

interface TopologyViewProps {
  backendService: IntegrationService | null;
  services: IntegrationService[];
  backendUp: boolean;
}

const STATUS_BORDER_COLOR: Record<ServiceStatus, string> = {
  up: 'var(--color-success)',
  down: 'var(--color-danger)',
  high_load: 'var(--color-warning)',
  timeout: 'var(--color-danger)',
  not_configured: 'var(--color-border)',
};

const SERVICE_ICONS: Record<string, string> = {
  verifier: '/keylime-verifier-green-square.png',
  registrar: '/keylime-registrar-green-square.png',
  timescaledb: '⧖',
  redis: '⚡',
  siem: '⚠',
};

function getServiceIcon(name: string): string | null {
  const lower = name.toLowerCase();
  for (const [key, icon] of Object.entries(SERVICE_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return null;
}

function isImagePath(icon: string): boolean {
  return icon.startsWith('/');
}

function extractSshHost(endpoint: string): string {
  try {
    const url = new URL(endpoint);
    return url.hostname;
  } catch {
    return endpoint.replace(/:\d+$/, '').replace(/^https?:\/\//, '');
  }
}

interface TopologyNodeProps {
  service: IntegrationService;
  nodeRef?: (el: HTMLDivElement | null) => void;
}

function TopologyNode({ service, nodeRef }: TopologyNodeProps) {
  const { canWrite } = useAuth();
  const normalizedStatus = service.status.toLowerCase() as ServiceStatus;
  const borderColor = STATUS_BORDER_COLOR[normalizedStatus] ?? 'var(--color-border)';
  const sshHost = extractSshHost(service.endpoint);

  return (
    <div
      ref={nodeRef}
      className="topology-node"
      style={{
        border: `2px solid ${borderColor}`,
        borderRadius: 'var(--radius-md)',
        padding: '16px',
        minWidth: '180px',
        background: 'var(--color-surface)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        position: 'relative',
      }}
    >
      <div style={{ fontSize: '28px', lineHeight: 1 }} aria-hidden="true">
        {(() => {
          const icon = getServiceIcon(service.name);
          const imgSrc = icon && isImagePath(icon) ? icon : !icon ? '/keylime-backend-green-square.png' : null;
          if (imgSrc) {
            return (
              <img
                src={imgSrc}
                alt=""
                width={32}
                height={32}
                style={{ display: 'block', background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)' }}
              />
            );
          }
          return icon;
        })()}
      </div>
      <div style={{ fontWeight: 600, fontSize: '14px', textAlign: 'center' }}>
        {service.name}
      </div>
      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', textAlign: 'center', wordBreak: 'break-all' }}>
        {service.endpoint}
      </div>
      <div
        className="topology-node__status"
        style={{
          fontSize: '11px',
          fontWeight: 600,
          color: borderColor,
          textTransform: 'uppercase',
        }}
      >
        {normalizedStatus.replace('_', ' ')}
      </div>
      {service.latency_ms !== undefined && (
        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
          {service.latency_ms}ms
        </div>
      )}
      {canWrite() && (
        <a
          href={`ssh://${sshHost}`}
          className="topology-node__ssh-btn"
          role="button"
          aria-label={`SSH to ${service.name}`}
          style={{
            marginTop: '4px',
            padding: '4px 12px',
            fontSize: '11px',
            fontWeight: 600,
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            color: 'var(--color-primary)',
            textDecoration: 'none',
            cursor: 'pointer',
            display: 'inline-block',
          }}
        >
          SSH
        </a>
      )}
    </div>
  );
}

const ARROW_HEIGHT = 48;

export function TopologyView({ backendService, services, backendUp }: TopologyViewProps) {
  const servicesRowRef = useRef<HTMLDivElement>(null);
  const serviceNodesRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const [connectorWidth, setConnectorWidth] = useState(0);
  const [targetXs, setTargetXs] = useState<number[]>([]);

  const setServiceRef = useCallback((name: string) => (el: HTMLDivElement | null) => {
    if (el) {
      serviceNodesRef.current.set(name, el);
    } else {
      serviceNodesRef.current.delete(name);
    }
  }, []);

  useLayoutEffect(() => {
    const row = servicesRowRef.current;
    if (!row || services.length === 0) {
      setTargetXs([]);
      setConnectorWidth(0);
      return;
    }

    const rowRect = row.getBoundingClientRect();
    setConnectorWidth(rowRect.width);

    const xs: number[] = [];
    services.forEach((svc) => {
      const el = serviceNodesRef.current.get(svc.name);
      if (el) {
        const r = el.getBoundingClientRect();
        xs.push(r.left + r.width / 2 - rowRect.left);
      }
    });
    setTargetXs(xs);
  }, [services]);

  const centerX = connectorWidth / 2;

  return (
    <div role="img" aria-label="Service topology diagram">
      {backendService && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <TopologyNode service={backendService} />
        </div>
      )}

      {!backendUp ? (
        <div className="placeholder" style={{ marginTop: '16px' }}>
          <div className="placeholder__text">Backend unavailable</div>
          <div className="placeholder__subtext">
            Core service topology requires a connection to the webtool backend.
          </div>
        </div>
      ) : services.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {connectorWidth > 0 && (
            <svg
              width={connectorWidth}
              height={ARROW_HEIGHT}
              aria-hidden="true"
              style={{ display: 'block' }}
            >
              <defs>
                <marker id="arrow-down" markerWidth="8" markerHeight="6" refX="4" refY="3" orient="auto">
                  <path d="M0,0 L8,3 L0,6" fill="var(--color-text-secondary)" />
                </marker>
              </defs>
              {targetXs.map((tx, i) => (
                <line
                  key={i}
                  x1={centerX}
                  y1={0}
                  x2={tx}
                  y2={ARROW_HEIGHT}
                  stroke="var(--color-text-secondary)"
                  strokeWidth="1.5"
                  markerEnd="url(#arrow-down)"
                />
              ))}
            </svg>
          )}
          <div
            ref={servicesRowRef}
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '24px',
            }}
          >
            {services.map((svc) => (
              <TopologyNode key={svc.name} service={svc} nodeRef={setServiceRef(svc.name)} />
            ))}
          </div>
        </div>
      ) : (
        <div className="placeholder" style={{ marginTop: '16px' }}>
          <div className="placeholder__icon">&#x1F517;</div>
          <div className="placeholder__text">No services configured</div>
          <div className="placeholder__subtext">
            Service topology for Verifier, Registrar, TimescaleDB, Redis, and SIEM integrations.
          </div>
        </div>
      )}
    </div>
  );
}
