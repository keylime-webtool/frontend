export const ALERT_SEVERITY_COLORS: Record<string, string> = {
  critical: '#ea4335',
  warning: '#f9ab00',
  info: '#1a73e8',
};

export const ALERT_STATE_COLORS: Record<string, string> = {
  new: '#ea4335',
  acknowledged: '#f9ab00',
  under_investigation: '#4285f4',
  resolved: '#34a853',
  dismissed: '#9e9e9e',
};

export const ALERT_TYPE_COLORS: Record<string, string> = {
  attestation_failure: '#ea4335',
  cert_expiry: '#f9ab00',
  policy_violation: '#e8710a',
  pcr_change: '#9334e6',
  service_down: '#d93025',
  rate_limit: '#4285f4',
  clock_skew: '#00897b',
};

export const ALERT_FALLBACK_COLOR = '#bdbdbd';

export const AGENT_STATE_COLORS: Record<string, string> = {
  GET_QUOTE: '#34a853',
  PROVIDE_V: '#4285f4',
  REGISTERED: '#a0c4ff',
  FAILED: '#ea4335',
  RETRY: '#f9ab00',
  TERMINATED: '#9e9e9e',
  INVALID_QUOTE: '#d93025',
  TENANT_FAILED: '#c62828',
  PASS: '#34a853',
  FAIL: '#ea4335',
  PENDING: '#f9ab00',
  TIMEOUT: '#ff6d00',
  UNKNOWN: '#bdbdbd',
};
