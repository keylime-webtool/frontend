import { describe, it, expect, beforeEach } from 'vitest';
import { getBackendUrl, setBackendUrl } from '../client';

beforeEach(() => {
  localStorage.clear();
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
