import { useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import {
  PieChart, Pie, Cell, Legend, ResponsiveContainer,
} from 'recharts';
import { KpiCard } from '@/components/common/KpiCard';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { alertsApi } from '@/api/alerts';
import { useFormatTimestamp } from '@/store/visualizationStore';
import type { Alert, AlertState } from '@/types';
import {
  ALERT_SEVERITY_COLORS, ALERT_TYPE_COLORS, ALERT_STATE_COLORS, ALERT_FALLBACK_COLOR,
} from '@/constants/colors';
import { createPieLabelRenderer } from '@/utils/pieLabel';
import { humanizeLabel } from '@/utils/humanize';

function buildChartData(items: Alert[], key: keyof Alert): { name: string; value: number }[] {
  const counts = new Map<string, number>();
  for (const alert of items) {
    const k = String(alert[key] ?? 'unknown');
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
}

function AlertPieChart({
  title,
  data,
  colors,
  dimension,
}: {
  title: string;
  data: { name: string; value: number }[];
  colors: Record<string, string>;
  dimension: string;
}) {
  const navigate = useNavigate();

  if (data.length === 0) {
    return (
      <div className="section" style={{ flex: 1, minWidth: 250 }}>
        <h2 className="section__title">{title}</h2>
        <div className="placeholder">
          <div className="placeholder__icon">&#x25EF;</div>
          <div className="placeholder__text">No data</div>
        </div>
      </div>
    );
  }

  return (
    <div className="section" style={{ flex: 1, minWidth: 250 }}>
      <h2 className="section__title">{title}</h2>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={80}
            innerRadius={40}
            dataKey="value"
            nameKey="name"
            isAnimationActive={false}
            label={createPieLabelRenderer({
              colors,
              fallbackColor: ALERT_FALLBACK_COLOR,
              offset: 16,
              fontSize: 11,
              onClick: (name) => navigate(`/alerts?${dimension}=${encodeURIComponent(name)}`),
            })}
            labelLine
            style={{ cursor: 'pointer' }}
            onClick={(_data, index) => {
              const entry = data[index];
              if (entry) {
                navigate(`/alerts?${dimension}=${encodeURIComponent(entry.name)}`);
              }
            }}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={colors[entry.name] ?? ALERT_FALLBACK_COLOR} />
            ))}
          </Pie>
          <Legend
            formatter={(value: string) => (
              <span style={{ cursor: 'pointer', fontSize: 12 }}>
                {humanizeLabel(value)}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

type AlertActionName = 'acknowledge' | 'investigate' | 'resolve' | 'dismiss' | 'escalate';

const ROW_ACTIONS: Record<AlertState, readonly AlertActionName[]> = {
  new: ['acknowledge', 'investigate', 'resolve', 'dismiss', 'escalate'],
  acknowledged: ['investigate', 'resolve', 'dismiss', 'escalate'],
  under_investigation: ['resolve', 'dismiss', 'escalate'],
  resolved: [],
  dismissed: [],
};

const ACTION_LABELS: Record<AlertActionName, string> = {
  acknowledge: 'Acknowledge',
  investigate: 'Investigate',
  resolve: 'Resolve',
  dismiss: 'Dismiss',
  escalate: 'Escalate',
};

function useAlertAction(
  action: (alertId: string) => Promise<unknown>,
  onFailure: (message: string) => void,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: action,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerts'] }),
    onError: (error) => onFailure(backendErrorMessage(error)),
  });
}

function backendErrorMessage(error: unknown): string {
  const response = (error as { response?: { data?: { error?: { message?: string } } } })
    ?.response;
  return response?.data?.error?.message ?? 'Alert action failed';
}

function ActionButton({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '4px 8px',
        fontSize: '11px',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--color-surface)',
        color: 'var(--color-text)',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {label}
    </button>
  );
}

export function Alerts() {
  const fmtTs = useFormatTimestamp();
  const [searchParams, setSearchParams] = useSearchParams();
  const severityFilter = useMemo(() => searchParams.get('severity') ?? '', [searchParams]);
  const stateFilter = useMemo(() => searchParams.get('state') ?? '', [searchParams]);
  const typeFilter = useMemo(() => searchParams.get('type') ?? '', [searchParams]);

  const { data: summary } = useQuery({
    queryKey: ['alerts', 'summary'],
    queryFn: () => alertsApi.summary(),
    select: (res) => res.data,
    placeholderData: keepPreviousData,
  });

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['alerts', severityFilter, stateFilter, typeFilter],
    queryFn: () =>
      alertsApi.list({
        severity: severityFilter || undefined,
        state: stateFilter || undefined,
        type: typeFilter || undefined,
      }),
    select: (res) => res.data,
    placeholderData: keepPreviousData,
  });

  const alertItems = useMemo(
    () => Array.isArray(alerts?.items) ? alerts.items : Array.isArray(alerts) ? alerts : [],
    [alerts]
  );

  const [actionError, setActionError] = useState<string | null>(null);

  // assigned_to and resolution are sent as empty payloads until prompting
  // for input is built; the backend treats both fields as optional.
  const acknowledge = useAlertAction((id) => alertsApi.acknowledge(id), setActionError);
  const investigate = useAlertAction((id) => alertsApi.investigate(id), setActionError);
  const resolve = useAlertAction((id) => alertsApi.resolve(id), setActionError);
  const dismiss = useAlertAction((id) => alertsApi.dismiss(id), setActionError);
  const escalate = useAlertAction((id) => alertsApi.escalate(id), setActionError);

  const actions = { acknowledge, investigate, resolve, dismiss, escalate };

  const isRowBusy = (alertId: string) =>
    Object.values(actions).some(
      (mutation) => mutation.isPending && mutation.variables === alertId,
    );

  const columns = [
    {
      key: 'severity',
      header: 'Severity',
      sortable: true,
      render: (row: Alert) => <StatusBadge label={row.severity} />,
    },
    {
      key: 'type',
      header: 'Type',
      sortable: true,
      render: (row: Alert) => humanizeLabel(row.type),
    },
    { key: 'description', header: 'Description' },
    {
      key: 'affected_agents',
      header: 'Agents',
      render: (row: Alert) => row.affected_agents?.length ?? 0,
    },
    {
      key: 'state',
      header: 'State',
      sortable: true,
      render: (row: Alert) => (
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <StatusBadge label={row.state} />
          {(row.escalation_count ?? 0) > 0 && (
            <StatusBadge label={`Escalated ×${row.escalation_count}`} variant="warning" />
          )}
        </div>
      ),
    },
    {
      key: 'created_timestamp',
      header: 'Created',
      sortable: true,
      render: (row: Alert) => <span>{fmtTs(row.created_timestamp)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: Alert) => (
        <div style={{ display: 'flex', gap: '4px' }}>
          {(ROW_ACTIONS[row.state] ?? []).map((action) => (
            <ActionButton
              key={action}
              label={ACTION_LABELS[action]}
              disabled={isRowBusy(row.id)}
              onClick={() => actions[action].mutate(row.id)}
            />
          ))}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-header__title">Alert Center</h1>
          <p className="page-header__subtitle">
            Monitor and manage security alerts with lifecycle tracking
          </p>
        </div>
        <button
          onClick={() => setSearchParams({})}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: 500,
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            cursor: 'pointer',
          }}
        >
          Show All Alerts
        </button>
      </div>

      <div className="kpi-grid">
        <KpiCard
          title="Critical"
          value={summary?.critical ?? '--'}
          variant="danger"
          onClick={() => setSearchParams({ severity: 'critical' })}
        />
        <KpiCard
          title="Warnings"
          value={summary?.warnings ?? '--'}
          variant="warning"
          onClick={() => setSearchParams({ severity: 'warning' })}
        />
        <KpiCard
          title="Info"
          value={summary?.info ?? '--'}
          variant="info"
          onClick={() => setSearchParams({ severity: 'info' })}
        />
      </div>

      <div className="section" style={{ display: 'flex', gap: '12px', padding: '12px 20px' }}>
        <select
          value={severityFilter}
          onChange={(e) => {
            const next = new URLSearchParams(searchParams);
            if (e.target.value) { next.set('severity', e.target.value); } else { next.delete('severity'); }
            setSearchParams(next);
          }}
          style={{ padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: '14px', color: 'var(--color-text)', background: 'var(--color-surface)' }}
          aria-label="Filter by severity"
        >
          <option value="">All severities</option>
          <option value="critical">Critical</option>
          <option value="warning">Warning</option>
          <option value="info">Info</option>
        </select>
        <select
          value={stateFilter}
          onChange={(e) => {
            const next = new URLSearchParams(searchParams);
            if (e.target.value) { next.set('state', e.target.value); } else { next.delete('state'); }
            setSearchParams(next);
          }}
          style={{ padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: '14px', color: 'var(--color-text)', background: 'var(--color-surface)' }}
          aria-label="Filter by state"
        >
          <option value="">All states</option>
          <option value="new">New</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="under_investigation">Investigating</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => {
            const next = new URLSearchParams(searchParams);
            if (e.target.value) { next.set('type', e.target.value); } else { next.delete('type'); }
            setSearchParams(next);
          }}
          style={{ padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: '14px', color: 'var(--color-text)', background: 'var(--color-surface)' }}
          aria-label="Filter by type"
        >
          <option value="">All types</option>
          <option value="attestation_failure">Attestation Failure</option>
          <option value="cert_expiry">Cert Expiry</option>
          <option value="policy_violation">Policy Violation</option>
          <option value="pcr_change">PCR Change</option>
          <option value="service_down">Service Down</option>
          <option value="rate_limit">Rate Limit</option>
          <option value="clock_skew">Clock Skew</option>
        </select>
      </div>

      {actionError && (
        <div
          role="alert"
          className="section"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 20px',
            border: '1px solid var(--color-danger)',
          }}
        >
          <span style={{ fontSize: '14px', color: 'var(--color-danger)' }}>{actionError}</span>
          <button
            onClick={() => setActionError(null)}
            aria-label="Dismiss error"
            style={{
              border: 'none',
              background: 'transparent',
              color: 'var(--color-text)',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            &#x2715;
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="placeholder">
          <div className="placeholder__text">Loading alerts...</div>
        </div>
      ) : (
        <DataTable<Alert>
          columns={columns}
          data={alertItems}
          keyField="id"
        />
      )}

      <div className="charts-row" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '24px' }}>
        <AlertPieChart
          title="By Severity"
          data={buildChartData(alertItems, 'severity')}
          colors={ALERT_SEVERITY_COLORS}
          dimension="severity"
        />
        <AlertPieChart
          title="By Type"
          data={buildChartData(alertItems, 'type')}
          colors={ALERT_TYPE_COLORS}
          dimension="type"
        />
        <AlertPieChart
          title="By State"
          data={buildChartData(alertItems, 'state')}
          colors={ALERT_STATE_COLORS}
          dimension="state"
        />
      </div>
    </div>
  );
}
