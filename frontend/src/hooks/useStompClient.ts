import { useEffect, useRef, useCallback, useState } from 'react';

interface StompFrame {
  command: string;
  headers: Record<string, string>;
  body: string;
}

interface UseStompClientOptions {
  url: string;
  token?: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

// Minimal STOMP-over-WebSocket client (no external deps)
export function useStompClient({ url, token, onConnect, onDisconnect }: UseStompClientOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const subscriptionsRef = useRef<Map<string, (body: string) => void>>(new Map());
  const [connected, setConnected] = useState(false);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const subIdCounter = useRef(0);

  const encodeFrame = useCallback((command: string, headers: Record<string, string>, body = ''): string => {
    let frame = `${command}\n`;
    for (const [k, v] of Object.entries(headers)) {
      frame += `${k}:${v}\n`;
    }
    frame += `\n${body}\0`;
    return frame;
  }, []);

  const parseFrame = useCallback((data: string): StompFrame | null => {
    const nullIdx = data.indexOf('\0');
    const raw = nullIdx >= 0 ? data.substring(0, nullIdx) : data;
    const parts = raw.split('\n\n');
    if (parts.length < 1) return null;
    const headerLines = parts[0].split('\n');
    const command = headerLines[0];
    const headers: Record<string, string> = {};
    for (let i = 1; i < headerLines.length; i++) {
      const colonIdx = headerLines[i].indexOf(':');
      if (colonIdx > 0) {
        headers[headerLines[i].substring(0, colonIdx)] = headerLines[i].substring(colonIdx + 1);
      }
    }
    const body = parts.length > 1 ? parts.slice(1).join('\n\n') : '';
    return { command, headers, body };
  }, []);

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        const headers: Record<string, string> = { 'accept-version': '1.2', 'heart-beat': '10000,10000' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        ws.send(encodeFrame('CONNECT', headers));
      };

      ws.onmessage = (event) => {
        const frame = parseFrame(typeof event.data === 'string' ? event.data : '');
        if (!frame) return;

        if (frame.command === 'CONNECTED') {
          setConnected(true);
          onConnect?.();
          // Resubscribe
          subscriptionsRef.current.forEach((cb, dest) => {
            const subId = `sub-${subIdCounter.current++}`;
            ws.send(encodeFrame('SUBSCRIBE', { id: subId, destination: dest }));
          });
        } else if (frame.command === 'MESSAGE') {
          const dest = frame.headers['destination'];
          if (dest && subscriptionsRef.current.has(dest)) {
            subscriptionsRef.current.get(dest)?.(frame.body);
          }
        }
      };

      ws.onclose = () => {
        setConnected(false);
        onDisconnect?.();
        reconnectTimerRef.current = setTimeout(connect, 3000);
      };

      ws.onerror = () => ws.close();
    } catch {
      reconnectTimerRef.current = setTimeout(connect, 5000);
    }
  }, [url, token, encodeFrame, parseFrame, onConnect, onDisconnect]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const subscribe = useCallback((destination: string, callback: (body: string) => void) => {
    subscriptionsRef.current.set(destination, callback);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const subId = `sub-${subIdCounter.current++}`;
      wsRef.current.send(encodeFrame('SUBSCRIBE', { id: subId, destination }));
    }
    return () => {
      subscriptionsRef.current.delete(destination);
    };
  }, [encodeFrame]);

  const send = useCallback((destination: string, body: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(encodeFrame('SEND', { destination, 'content-type': 'application/json' }, JSON.stringify(body)));
    }
  }, [encodeFrame]);

  return { connected, subscribe, send };
}
