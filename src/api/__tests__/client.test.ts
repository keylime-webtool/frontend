import { describe, it, expect, beforeEach } from 'vitest';
import { getBackendUrl, setBackendUrl } from '../client';
import apiClient from '../client';

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe('getBackendUrl', () => {
  it('returns default when no saved URL', () => {
    expect(getBackendUrl()).toBe('http://localhost:8080');
  });

  it('returns saved URL from localStorage', () => {
    localStorage.setItem('backend-url', 'https://custom-backend:9090');
    expect(getBackendUrl()).toBe('https://custom-backend:9090');
  });

  it('strips trailing slashes from saved URL', () => {
    localStorage.setItem('backend-url', 'https://backend:8080///');
    expect(getBackendUrl()).toBe('https://backend:8080');
  });
});

describe('setBackendUrl', () => {
  it('stores trimmed URL in localStorage', () => {
    setBackendUrl('  https://example.com/  ');
    expect(localStorage.getItem('backend-url')).toBe('https://example.com');
  });

  it('removes entry for empty string', () => {
    localStorage.setItem('backend-url', 'https://old.url');
    setBackendUrl('');
    expect(localStorage.getItem('backend-url')).toBeNull();
  });

  it('removes entry for whitespace-only string', () => {
    localStorage.setItem('backend-url', 'https://old.url');
    setBackendUrl('   ');
    expect(localStorage.getItem('backend-url')).toBeNull();
  });
});

describe('request interceptor — auth header', () => {
  const authInterceptor = (apiClient.interceptors.request as unknown as { handlers: { fulfilled: (config: Record<string, unknown>) => Record<string, unknown> }[] }).handlers[1];

  it('adds Authorization header when token exists', () => {
    sessionStorage.setItem('access_token', 'test-jwt-token');
    const config = { headers: {} as Record<string, string> };
    const result = authInterceptor.fulfilled(config);
    expect((result.headers as Record<string, string>).Authorization).toBe('Bearer test-jwt-token');
  });

  it('does not add Authorization header when no token', () => {
    const config = { headers: {} as Record<string, string> };
    const result = authInterceptor.fulfilled(config);
    expect((result.headers as Record<string, string>).Authorization).toBeUndefined();
  });
});

describe('response interceptor', () => {
  const responseInterceptor = (apiClient.interceptors.response as unknown as { handlers: { fulfilled: (response: unknown) => unknown; rejected: (error: unknown) => Promise<never> }[] }).handlers[0];

  it('unwraps envelope response with success field', () => {
    const response = { data: { success: true, data: { foo: 1 }, timestamp: '2025-01-01' } };
    const result = responseInterceptor.fulfilled(response) as { data: unknown };
    expect(result.data).toEqual({ foo: 1 });
  });

  it('passes through response without envelope', () => {
    const response = { data: [{ id: 1 }] };
    const result = responseInterceptor.fulfilled(response) as { data: unknown };
    expect(result.data).toEqual([{ id: 1 }]);
  });

  it('passes through response with non-object data', () => {
    const response = { data: 'plain text' };
    const result = responseInterceptor.fulfilled(response) as { data: unknown };
    expect(result.data).toBe('plain text');
  });

  it('removes token on 401 error', async () => {
    sessionStorage.setItem('access_token', 'old-token');
    const error = { response: { status: 401 } };
    await expect(responseInterceptor.rejected(error)).rejects.toEqual(error);
    expect(sessionStorage.getItem('access_token')).toBeNull();
  });

  it('does not remove token on non-401 error', async () => {
    sessionStorage.setItem('access_token', 'keep-me');
    const error = { response: { status: 500 } };
    await expect(responseInterceptor.rejected(error)).rejects.toEqual(error);
    expect(sessionStorage.getItem('access_token')).toBe('keep-me');
  });
});
