export type AuditSeverity = 'CRITICAL' | 'WARNING' | 'INFO';

export interface AuditLogEntry {
  id: number;
  /** RFC 3339 */
  timestamp: string;
  severity: AuditSeverity;
  /** "system" until authentication lands (SR-001) */
  actor: string;
  /** Free-form: config_change, alert_action, integration_check, ... */
  action: string;
  /** Single field: "settings/keylime" or an alert UUID */
  resource: string;
  /** "unknown" for backend-initiated actions */
  source_ip: string;
  user_agent: string | null;
  /** Free-form: SUCCESS, acknowledged, resolved, UNREACHABLE, "SUCCESS (12ms)" */
  result: string;
  /** 64 hex chars; 64 zeros for the genesis entry */
  previous_hash: string;
  entry_hash: string;
}

export interface HashChainStatus {
  verified: boolean;
  total_entries: number;
  /** Present only when the chain is broken (409 body) */
  broken_entry_id?: number;
  reason?: string;
}
