import { useQuery } from '@tanstack/react-query';
import { KpiCard } from '@/components/common/KpiCard';
import { performanceApi } from '@/api/performance';

const CIRCUIT_BREAKER_LABELS: Record<string, string> = {
  closed: 'Closed',
  open: 'Open',
  half_open: 'Half-Open',
};

type CbVariant = 'success' | 'danger' | 'warning';

const CIRCUIT_BREAKER_VARIANTS: Record<string, CbVariant> = {
  closed: 'success',
  open: 'danger',
  half_open: 'warning',
};

function capacityVariant(pct: number): 'default' | 'warning' | 'danger' {
  if (pct > 90) return 'danger';
  if (pct > 70) return 'warning';
  return 'default';
}

export function Performance() {
  const { data: perf } = useQuery({
    queryKey: ['performance', 'summary'],
    queryFn: () => performanceApi.summary(),
    select: (res) => res.data,
  });

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title">System Performance</h1>
        <p className="page-header__subtitle">Monitor Keylime verifier cluster health and resource utilization</p>
      </div>

      <div className="kpi-grid">
        <KpiCard
          title="Verifier Status"
          value={perf ? (perf.verifier_reachable ? 'Reachable' : 'Unreachable') : '--'}
          subtitle={perf?.verifier_latency_ms != null ? `${perf.verifier_latency_ms} ms` : undefined}
          variant={perf ? (perf.verifier_reachable ? 'success' : 'danger') : 'default'}
        />
        <KpiCard
          title="Circuit Breaker"
          value={perf ? (CIRCUIT_BREAKER_LABELS[perf.circuit_breaker_state] ?? perf.circuit_breaker_state) : '--'}
          variant={perf ? (CIRCUIT_BREAKER_VARIANTS[perf.circuit_breaker_state] ?? 'default') : 'default'}
        />
        <KpiCard
          title="Attestation Rate"
          value={perf?.estimated_attestation_rate != null ? `${perf.estimated_attestation_rate}/s` : '--'}
          variant="success"
        />
        <KpiCard
          title="Capacity"
          value={perf?.capacity_utilization_pct != null ? `${perf.capacity_utilization_pct.toFixed(1)}%` : '--'}
          variant={perf?.capacity_utilization_pct != null ? capacityVariant(perf.capacity_utilization_pct) : 'default'}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="section">
          <h2 className="section__title">Verifier Cluster Metrics</h2>
          <div className="placeholder">
            <div className="placeholder__icon">&#x1F4CA;</div>
            <div className="placeholder__text">Resource utilization charts</div>
            <div className="placeholder__subtext">
              CPU, memory, open FDs, thread pool, and network connections over time.
            </div>
          </div>
        </div>

        <div className="section">
          <h2 className="section__title">Database Pool Status</h2>
          <div className="placeholder">
            <div className="placeholder__icon">&#x1F4BE;</div>
            <div className="placeholder__text">Connection pool metrics</div>
            <div className="placeholder__subtext">
              Active/idle/overflow connections, average query time, slow query detection (&gt;100ms).
            </div>
          </div>
        </div>
      </div>

      <div className="section">
        <h2 className="section__title">Circuit Breaker Status</h2>
        <div className="placeholder">
          <div className="placeholder__icon">&#x26A1;</div>
          <div className="placeholder__text">Verifier API circuit breaker</div>
          <div className="placeholder__subtext">
            Current state (Closed/Open/Half-Open), failure count, and next retry time.
          </div>
        </div>
      </div>
    </div>
  );
}
