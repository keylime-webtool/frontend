import { useEffect, useRef, useCallback, useState } from 'react';

const WS_BASE_URL = import.meta.env.VITE_WS_URL || `ws://${window.location.host}/ws`;

interface UseWebSocketOptions {
  channel: string;
  onMessage: (data: unknown) => void;
  enabled?: boolean;
}

export function useWebSocket({ channel, onMessage, enabled = true }: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const retryCountRef = useRef(0);
  const connectRef = useRef<() => void>();
  const [connected, setConnected] = useState(false);

  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  connectRef.current = useCallback(() => {
    if (!enabled) return;

    const token = sessionStorage.getItem('access_token');
    const url = `${WS_BASE_URL}/${channel}${token ? `?token=${token}` : ''}`;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      retryCountRef.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessageRef.current(data);
      } catch {
        onMessageRef.current(event.data);
      }
    };

    ws.onclose = () => {
      setConnected(false);
      const delay = Math.min(1000 * 2 ** retryCountRef.current, 30000);
      retryCountRef.current += 1;
      reconnectTimeoutRef.current = setTimeout(() => connectRef.current?.(), delay);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [channel, enabled]);

  useEffect(() => {
    connectRef.current?.();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      wsRef.current?.close();
    };
  }, [channel, enabled]);

  return { connected };
}
