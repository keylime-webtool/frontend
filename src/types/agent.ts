export type AgentState =
  | 'registered'
  | 'get_quote'
  | 'provide_v'
  | 'failed'
  | 'retry'
  | 'terminated'
  | 'invalid_quote'
  | 'tenant_failed';

export type ApiVersion = 'v2_pull' | 'v3_push';

export interface AgentHardwareInfo {
  tpm_model: string;
  tpm_version: string;
}

export interface Agent {
  uuid: string;
  ip_address: string;
  hostname: string;
  state: AgentState;
  verifier_id: string;
  registrar_id: string;
  ima_policy: string;
  mb_policy: string;
  last_attestation: string;
  consecutive_failures: number;
  registration_date: string;
  api_version: ApiVersion;
  hardware_info: AgentHardwareInfo;
}

export interface AgentListParams {
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  state?: AgentState;
  search?: string;
  datacenter?: string;
  policy?: string;
  ip_range?: string;
}

export interface AgentPcrValues {
  bank: string;
  values: Record<string, string>;
  expected: Record<string, string>;
}

export interface ImaLogEntry {
  index: number;
  template: string;
  file_path: string;
  file_hash: string;
  policy_match: boolean;
}

export interface BootLogEntry {
  index: number;
  event_type: string;
  digest: string;
  description: string;
  validation_status: 'valid' | 'invalid' | 'unknown';
}
