import { useQuery } from '@tanstack/react-query';
import { KpiCard } from '@/components/common/KpiCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { attestationsApi } from '@/api/attestations';
import { agentsApi } from '@/api/agents';
import { alertsApi } from '@/api/alerts';
import { useOutletContext } from 'react-router-dom';

export function Dashboard() {
  const { timeRange } = useOutletContext<{ timeRange: string }>();

  const { data: agents } = useQuery({
    queryKey: ['agents', 'list'],
    queryFn: () => agentsApi.list({ per_page: 1 }),
    select: (res) => res.data,
  });

  const { data: attestationSummary } = useQuery({
    queryKey: ['attestations', 'summary', timeRange],
    queryFn: () => attestationsApi.summary(timeRange),
    select: (res) => res.data,
  });

  const { data: alertSummary } = useQuery({
    queryKey: ['alerts', 'summary'],
    queryFn: () => alertsApi.summary(),
    select: (res) => res.data,
  });

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title">Fleet Overview</h1>
        <p className="page-header__subtitle">
          Real-time Keylime attestation monitoring dashboard
        </p>
      </div>

      <div className="kpi-grid">
        <KpiCard
          title="Total Agents"
          value={agents?.total ?? '--'}
          variant="default"
        />
        <KpiCard
          title="Attestation Success Rate"
          value={
            attestationSummary?.success_rate != null
              ? `${attestationSummary.success_rate.toFixed(1)}%`
              : '--'
          }
          variant="success"
        />
        <KpiCard
          title="Failed Attestations"
          value={attestationSummary?.total_failed ?? '--'}
          variant="danger"
          subtitle={`in last ${timeRange}`}
        />
        <KpiCard
          title="Active Alerts"
          value={
            alertSummary?.critical != null && alertSummary?.warnings != null
              ? alertSummary.critical + alertSummary.warnings
              : '--'
          }
          variant="warning"
          subtitle={`${alertSummary?.critical ?? 0} critical`}
        />
      </div>

      <div className="section">
        <h2 className="section__title">Recent Alerts</h2>
        <div className="placeholder">
          <div className="placeholder__icon">&#x26A0;</div>
          <div className="placeholder__text">Alert feed</div>
          <div className="placeholder__subtext">
            Real-time alerts will appear here once connected to the backend.
            Each alert shows severity, affected agents, and recommended actions.
          </div>
        </div>
      </div>

      <div className="section">
        <h2 className="section__title">Attestation Success Rate ({timeRange})</h2>
        <div className="placeholder">
          <div className="placeholder__icon">&#x1F4CA;</div>
          <div className="placeholder__text">Timeline chart</div>
          <div className="placeholder__subtext">
            A time-series chart showing attestation success/failure rates over the selected time range.
          </div>
        </div>
      </div>

      <div className="section">
        <h2 className="section__title">Agent State Distribution</h2>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <StatusBadge label="GET_QUOTE" />
          <StatusBadge label="FAILED" />
          <StatusBadge label="RETRY" />
          <StatusBadge label="REGISTERED" />
          <StatusBadge label="TERMINATED" />
        </div>
        <div className="placeholder" style={{ paddingTop: '30px' }}>
          <div className="placeholder__icon">&#x25EF;</div>
          <div className="placeholder__text">State distribution pie chart</div>
          <div className="placeholder__subtext">
            Agent count by state with color-coded segments.
          </div>
        </div>
      </div>
    </div>
  );
}
