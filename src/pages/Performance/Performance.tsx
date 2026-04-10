import { useQuery } from '@tanstack/react-query';
import { KpiCard } from '@/components/common/KpiCard';
import { performanceApi } from '@/api/performance';

export function Performance() {
  const { data: perf } = useQuery({
    queryKey: ['system', 'performance'],
    queryFn: () => performanceApi.system(),
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
          title="CPU Usage"
          value={perf ? `${perf.cpu_percent.toFixed(1)}%` : '--'}
          variant={perf && perf.cpu_percent > 80 ? 'danger' : 'default'}
        />
        <KpiCard
          title="Memory Usage"
          value={perf ? `${perf.memory_percent.toFixed(1)}%` : '--'}
          variant={perf && perf.memory_percent > 80 ? 'danger' : 'default'}
        />
        <KpiCard
          title="Attestations/sec"
          value={perf?.attestations_per_sec ?? '--'}
          variant="success"
        />
        <KpiCard
          title="Queue Depth"
          value={perf?.queue_depth ?? '--'}
          variant={perf && perf.queue_depth > 100 ? 'warning' : 'default'}
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
