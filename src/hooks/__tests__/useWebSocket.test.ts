import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWebSocket } from '../useWebSocket';

let wsInstances: MockWebSocket[] = [];

class MockWebSocket {
  url: string;
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  closed = false;

  constructor(url: string) {
    this.url = url;
    wsInstances.push(this);
  }

  close() {
    this.closed = true;
    this.onclose?.();
  }

  send() {}
}

beforeEach(() => {
  wsInstances = [];
  vi.useFakeTimers();
  vi.stubGlobal('WebSocket', MockWebSocket);
  sessionStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('useWebSocket', () => {
  it('creates a WebSocket connection', () => {
    const onMessage = vi.fn();
    renderHook(() => useWebSocket({ channel: 'test', onMessage }));
    expect(wsInstances).toHaveLength(1);
    expect(wsInstances[0].url).toContain('/test');
  });

  it('sets connected to true on open', () => {
    const onMessage = vi.fn();
    const { result } = renderHook(() => useWebSocket({ channel: 'test', onMessage }));
    expect(result.current.connected).toBe(false);
    act(() => wsInstances[0].onopen?.());
    expect(result.current.connected).toBe(true);
  });

  it('passes parsed JSON messages to onMessage', () => {
    const onMessage = vi.fn();
    renderHook(() => useWebSocket({ channel: 'test', onMessage }));
    act(() => wsInstances[0].onopen?.());
    act(() => wsInstances[0].onmessage?.({ data: '{"type":"update"}' }));
    expect(onMessage).toHaveBeenCalledWith({ type: 'update' });
  });

  it('passes raw data when JSON parsing fails', () => {
    const onMessage = vi.fn();
    renderHook(() => useWebSocket({ channel: 'test', onMessage }));
    act(() => wsInstances[0].onopen?.());
    act(() => wsInstances[0].onmessage?.({ data: 'raw-text' }));
    expect(onMessage).toHaveBeenCalledWith('raw-text');
  });

  it('does not connect when disabled', () => {
    const onMessage = vi.fn();
    renderHook(() => useWebSocket({ channel: 'test', onMessage, enabled: false }));
    expect(wsInstances).toHaveLength(0);
  });

  it('includes token in URL when available', () => {
    sessionStorage.setItem('access_token', 'my-jwt');
    const onMessage = vi.fn();
    renderHook(() => useWebSocket({ channel: 'alerts', onMessage }));
    expect(wsInstances[0].url).toContain('?token=my-jwt');
  });

  it('reconnects with exponential backoff on close', () => {
    const onMessage = vi.fn();
    renderHook(() => useWebSocket({ channel: 'test', onMessage }));
    act(() => wsInstances[0].onopen?.());
    act(() => {
      wsInstances[0].onclose?.();
    });
    expect(wsInstances).toHaveLength(1);
    act(() => { vi.advanceTimersByTime(1000); });
    expect(wsInstances).toHaveLength(2);
  });

  it('closes WebSocket on error', () => {
    const onMessage = vi.fn();
    renderHook(() => useWebSocket({ channel: 'test', onMessage }));
    act(() => wsInstances[0].onerror?.());
    expect(wsInstances[0].closed).toBe(true);
  });

  it('cleans up on unmount', () => {
    const onMessage = vi.fn();
    const { unmount } = renderHook(() => useWebSocket({ channel: 'test', onMessage }));
    unmount();
    expect(wsInstances[0].closed).toBe(true);
  });
});
