/**
 * Shape of every WebSocket message received from the backend.
 * Mirrors the Java `WebSocketMessage` record.
 */
export interface WebSocketMessage {
  type:
    | 'NOTIFICATION'
    | 'STATUS_CHANGE'
    | 'NEW_COMMENT'
    | 'DOCUMENT_UPLOAD'
    | 'SAFETY_ALERT'
    | string;
  entityType: string;
  entityId: string;
  projectId: string | null;
  title: string;
  message: string;
  data: Record<string, unknown>;
  timestamp: string; // ISO-8601
}

/**
 * Thin wrapper returned by subscribe helpers so callers can unsubscribe later.
 */
export interface Subscription {
  unsubscribe(): void;
}

type ConnectionListener = (connected: boolean) => void;

/**
 * WebSocket client using STOMP over SockJS.
 *
 * Key improvement: subscriptions requested before the connection is fully
 * established are queued and replayed once `onConnect` fires, preventing the
 * race condition where `subscribeToUser()` returns a no-op because the
 * connection handshake hasn't completed yet.
 */
class WebSocketClient {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private client: any = null;
  private _connected = false;
  private _listeners: ConnectionListener[] = [];

  /** Subscriptions waiting for the connection to become ready. */
  private _pendingSubscriptions: Array<{
    dest: string;
    cb: (msg: WebSocketMessage) => void;
    resolve: (sub: Subscription) => void;
  }> = [];

  /** Active STOMP subscriptions so we can bulk-unsubscribe on disconnect. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _activeSubscriptions: any[] = [];

  connect(token: string): void {
    if (this._connected || this.client) return;

    try {
      // Dynamic import so missing packages don't crash at module-load time
      Promise.all([
        import('@stomp/stompjs'),
        import('sockjs-client'),
      ]).then(([{ Client }, SockJSModule]) => {
        const SockJS = SockJSModule.default ?? SockJSModule;
        const baseUrl =
          import.meta.env.VITE_WS_URL ??
          import.meta.env.VITE_API_URL?.replace(/\/api$/, '') ??
          window.location.origin;

        this.client = new Client({
          webSocketFactory: () => new SockJS(`${baseUrl}/ws`),
          connectHeaders: { Authorization: `Bearer ${token}` },
          reconnectDelay: 5_000,
          heartbeatIncoming: 10_000,
          heartbeatOutgoing: 10_000,
          debug: (msg: string) => {
            if (import.meta.env.DEV) {
              // eslint-disable-next-line no-console
              console.debug('[WS]', msg);
            }
          },
        });

        this.client.onConnect = () => {
          this._connected = true;
          this._notifyListeners();
          this._replayPending();
        };

        this.client.onDisconnect = () => {
          this._connected = false;
          this._notifyListeners();
        };

        this.client.onStompError = () => {
          this._connected = false;
          this._notifyListeners();
        };

        this.client.activate();
      }).catch(() => {
        // @stomp/stompjs or sockjs-client not installed -- silent no-op
      });
    } catch {
      // ignore
    }
  }

  disconnect(): void {
    // Unsubscribe all active subscriptions
    for (const sub of this._activeSubscriptions) {
      try { sub.unsubscribe(); } catch { /* ignore */ }
    }
    this._activeSubscriptions = [];
    this._pendingSubscriptions = [];

    if (this.client) {
      try { this.client.deactivate(); } catch { /* ignore */ }
    }
    this.client = null;
    this._connected = false;
    this._notifyListeners();
  }

  subscribeToProject(
    projectId: string,
    callback: (msg: WebSocketMessage) => void,
  ): Subscription {
    return this._sub(`/topic/project.${projectId}`, callback);
  }

  subscribeToUser(callback: (msg: WebSocketMessage) => void): Subscription {
    return this._sub('/user/queue/notifications', callback);
  }

  subscribeToBroadcast(callback: (msg: WebSocketMessage) => void): Subscription {
    return this._sub('/topic/broadcast', callback);
  }

  /**
   * Subscribe to a specific channel's typing events.
   */
  subscribeToChannelTyping(
    channelId: string,
    callback: (msg: { userId: string; userName: string }) => void,
  ): Subscription {
    return this.subscribeRaw(`/topic/channel.${channelId}.typing`, callback);
  }

  /**
   * Subscribe to a specific channel's new messages (real-time push).
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  subscribeToChannelMessages(channelId: string, callback: (msg: any) => void): Subscription {
    return this.subscribeRaw(`/topic/channel.${channelId}.messages`, callback);
  }

  /**
   * Subscribe to read receipts for a channel.
   */
  subscribeToChannelReadReceipts(
    channelId: string,
    callback: (msg: { userId: string; messageId: string; status: string }) => void,
  ): Subscription {
    return this.subscribeRaw(`/topic/channel.${channelId}.read`, callback);
  }

  /**
   * Subscribe to a raw STOMP destination with a generic message handler.
   * Unlike the typed helpers above, this one does NOT parse the body as
   * `WebSocketMessage` — it passes the raw parsed JSON to the callback.
   */
  subscribeRaw<T = unknown>(dest: string, callback: (msg: T) => void): Subscription {
    if (this.client && this._connected) {
      return this._doSubscribeRaw(dest, callback);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let liveSub: any = null;
    const entry = {
      dest,
      cb: callback as (msg: WebSocketMessage) => void,
      resolve: (sub: Subscription) => { liveSub = sub; },
    };
    this._pendingSubscriptions.push(entry);

    return {
      unsubscribe: () => {
        this._pendingSubscriptions = this._pendingSubscriptions.filter((e) => e !== entry);
        if (liveSub) { try { liveSub.unsubscribe(); } catch { /* ignore */ } }
      },
    };
  }

  /**
   * Publish (send) a STOMP message to a destination.
   * Used for WebRTC signaling via `/app/signal`.
   */
  publish(dest: string, body: unknown): void {
    if (!this.client || !this._connected) {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn('[WS] Cannot publish — not connected', dest);
      }
      return;
    }
    try {
      this.client.publish({
        destination: dest,
        body: JSON.stringify(body),
      });
    } catch {
      // ignore
    }
  }

  isConnected(): boolean {
    return this._connected;
  }

  /** Register a listener that fires whenever the connection state changes. */
  onConnectionChange(listener: ConnectionListener): () => void {
    this._listeners.push(listener);
    return () => {
      this._listeners = this._listeners.filter((l) => l !== listener);
    };
  }

  // ── internals ──────────────────────────────────────────────────────────

  private _notifyListeners(): void {
    for (const l of this._listeners) {
      try { l(this._connected); } catch { /* ignore */ }
    }
  }

  /**
   * Subscribe to a STOMP destination.  If the connection is not ready yet the
   * subscription is queued and a Subscription handle is returned immediately.
   * Calling `unsubscribe()` on that handle will cancel both the pending entry
   * and the eventual live subscription.
   */
  private _sub(dest: string, cb: (msg: WebSocketMessage) => void): Subscription {
    if (this.client && this._connected) {
      return this._doSubscribe(dest, cb);
    }

    // Not connected yet -- queue the subscription
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let liveSub: any = null;

    const entry = {
      dest,
      cb,
      resolve: (sub: Subscription) => {
        liveSub = sub;
      },
    };
    this._pendingSubscriptions.push(entry);

    return {
      unsubscribe: () => {
        // Remove from pending queue
        this._pendingSubscriptions = this._pendingSubscriptions.filter((e) => e !== entry);
        // If it was already resolved, unsubscribe the live sub
        if (liveSub) {
          try { liveSub.unsubscribe(); } catch { /* ignore */ }
        }
      },
    };
  }

  /** Subscribe with raw JSON parsing (no WebSocketMessage typing). */
  private _doSubscribeRaw<T>(dest: string, cb: (msg: T) => void): Subscription {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stomp = this.client.subscribe(dest, (frame: any) => {
      try { cb(JSON.parse(frame.body)); } catch { /* ignore */ }
    });
    this._activeSubscriptions.push(stomp);
    return {
      unsubscribe: () => {
        try { stomp?.unsubscribe(); } catch { /* ignore */ }
        this._activeSubscriptions = this._activeSubscriptions.filter((s: unknown) => s !== stomp);
      },
    };
  }

  /** Actually subscribe on the STOMP client (connection must be ready). */
  private _doSubscribe(dest: string, cb: (msg: WebSocketMessage) => void): Subscription {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stomp = this.client.subscribe(dest, (frame: any) => {
      try { cb(JSON.parse(frame.body)); } catch { /* ignore */ }
    });
    this._activeSubscriptions.push(stomp);

    return {
      unsubscribe: () => {
        try { stomp?.unsubscribe(); } catch { /* ignore */ }
        this._activeSubscriptions = this._activeSubscriptions.filter((s) => s !== stomp);
      },
    };
  }

  /** Replay all subscriptions that were queued before the connection was ready. */
  private _replayPending(): void {
    const pending = [...this._pendingSubscriptions];
    this._pendingSubscriptions = [];

    for (const { dest, cb, resolve } of pending) {
      const sub = this._doSubscribe(dest, cb);
      resolve(sub);
    }
  }
}

/**
 * Singleton WebSocket client instance shared across the application.
 */
export const wsClient = new WebSocketClient();
