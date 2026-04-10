export type { Agent, AgentState, AgentListParams, AgentPcrValues, ImaLogEntry, BootLogEntry } from './agent';
export type { Attestation, AttestationSummary, AttestationTimelinePoint, FailureCategoryCount, AttestationIncident, FailureType } from './attestation';
export type { Policy, PolicyVersion, PolicyImpactResult, PolicyKind, ApprovalState } from './policy';
export type { Certificate, CertificateExpirySummary, CertificateType, ExpiryCategory } from './certificate';
export type { Alert, AlertSummary, AlertSeverity, AlertState, AlertType } from './alert';
export type { AuditLogEntry, HashChainStatus, AuditSeverity, AuditAction } from './audit';

export type UserRole = 'viewer' | 'operator' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
}

export type ServiceStatus = 'up' | 'down' | 'high_load' | 'timeout' | 'not_configured';

export interface IntegrationService {
  name: string;
  address: string;
  status: ServiceStatus;
  uptime?: string;
  latency_ms?: number;
}

export interface SystemPerformance {
  cpu_percent: number;
  memory_percent: number;
  open_fds: number;
  thread_count: number;
  attestations_per_sec: number;
  queue_depth: number;
}

export interface TimeRange {
  label: string;
  value: string;
  hours: number;
}

export const TIME_RANGES: TimeRange[] = [
  { label: '1h', value: '1h', hours: 1 },
  { label: '6h', value: '6h', hours: 6 },
  { label: '24h', value: '24h', hours: 24 },
  { label: '7d', value: '7d', hours: 168 },
  { label: '30d', value: '30d', hours: 720 },
];
