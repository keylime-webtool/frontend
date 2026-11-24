import { isAxiosError, type AxiosResponse } from 'axios';
import apiClient from './client';
import type { AuditLogEntry, HashChainStatus, PaginatedResponse } from '@/types';

export type AuditExportFormat = 'csv' | 'json';

export interface AuditLogFilters {
  severity?: string;
  action?: string;
  actor?: string;
  start?: string;
  end?: string;
}

export interface AuditListParams extends AuditLogFilters {
  page?: number;
  page_size?: number;
}

export interface AuditExportFile {
  blob: Blob;
  filename: string;
}

const BROKEN_CHAIN_STATUS = 409;
const CONTENT_DISPOSITION_FILENAME = /filename\*?=(?:UTF-8'')?"?([^";]+)/i;

export const auditApi = {
  list({ severity, ...params }: AuditListParams = {}) {
    return apiClient.get<PaginatedResponse<AuditLogEntry>>('/audit-log', {
      params: { ...params, severity: severity?.toUpperCase() },
    });
  },

  export(format: AuditExportFormat, { severity, ...filters }: AuditLogFilters = {}) {
    return apiClient
      .get<Blob>('/audit-log/export', {
        params: { format, ...filters, severity: severity?.toUpperCase() },
        responseType: 'blob',
      })
      .then((response) => toExportFile(response, format));
  },

  verifyChain() {
    return fetchChainStatus();
  },
};

async function fetchChainStatus(): Promise<HashChainStatus> {
  try {
    const response = await apiClient.get<HashChainStatus>('/audit-log/verify');
    return response.data;
  } catch (error) {
    const brokenChain = toBrokenChainStatus(error);
    if (brokenChain) return brokenChain;
    throw error;
  }
}

function toBrokenChainStatus(error: unknown): HashChainStatus | undefined {
  if (!isAxiosError(error) || error.response?.status !== BROKEN_CHAIN_STATUS) return undefined;
  return error.response.data as HashChainStatus;
}

function toExportFile(response: AxiosResponse<Blob>, format: AuditExportFormat): AuditExportFile {
  return {
    blob: response.data,
    filename: filenameFromDisposition(response.headers) ?? fallbackFilename(format),
  };
}

function filenameFromDisposition(headers: AxiosResponse['headers'] | undefined): string | undefined {
  const disposition = headers?.['content-disposition'];
  if (typeof disposition !== 'string') return undefined;
  return CONTENT_DISPOSITION_FILENAME.exec(disposition)?.[1];
}

function fallbackFilename(format: AuditExportFormat): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `audit-log-${timestamp}.${format}`;
}
