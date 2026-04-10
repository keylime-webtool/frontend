export type CertificateType =
  | 'ek'
  | 'ak'
  | 'iak'
  | 'idevid'
  | 'mtls'
  | 'server_cert';

export type ExpiryCategory =
  | 'valid'
  | 'warning_90d'
  | 'warning_30d'
  | 'critical_7d'
  | 'critical_1d'
  | 'expired';

export type ValidationStatus = 'valid' | 'invalid' | 'unknown';

export interface Certificate {
  id: string;
  type: CertificateType;
  subject_dn: string;
  issuer_dn: string;
  serial_number: string;
  not_before: string;
  not_after: string;
  public_key_algorithm: string;
  public_key_size: number;
  signature_algorithm: string;
  san: string[];
  key_usage: string[];
  extended_key_usage: string[];
  associated_entity: string;
  chain: Certificate[];
  validation_status: ValidationStatus;
  expiry_category: ExpiryCategory;
}

export interface CertificateExpirySummary {
  expired: number;
  expiring_30d: number;
  valid: number;
  total: number;
}
