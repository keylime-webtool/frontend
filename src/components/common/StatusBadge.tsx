import './common.css';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
}

const VARIANT_MAP: Record<string, BadgeVariant> = {
  // Agent states
  get_quote: 'success',
  provide_v: 'success',
  registered: 'info',
  failed: 'danger',
  retry: 'warning',
  terminated: 'neutral',
  invalid_quote: 'danger',
  tenant_failed: 'danger',
  // Service status
  up: 'success',
  down: 'danger',
  high_load: 'warning',
  timeout: 'warning',
  not_configured: 'neutral',
  // Alert severity
  critical: 'danger',
  warning: 'warning',
  info: 'info',
  // Generic
  pass: 'success',
  fail: 'danger',
  valid: 'success',
  invalid: 'danger',
  expired: 'danger',
  unknown: 'neutral',
};

export function StatusBadge({ label, variant }: StatusBadgeProps) {
  const safeLabel = label ?? '--';
  const resolvedVariant = variant || VARIANT_MAP[safeLabel.toLowerCase()] || 'neutral';

  return (
    <span className={`status-badge status-badge--${resolvedVariant}`}>
      {safeLabel}
    </span>
  );
}
