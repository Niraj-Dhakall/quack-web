import type {
  BadgePayload,
  ClientMessage,
  ConnectionStatus,
  ServerMessage,
  Session,
} from "@/types";
import { env } from "./env";
import type {
  Gateway,
  GatewayConnection,
  MessageHandler,
  StatusHandler,
} from "./gateway";

const HEARTBEAT_INTERVAL_MS = 15_000;
const MAX_BACKOFF_MS = 10_000;

class WebSocketConnection implements GatewayConnection {
  private socket: WebSocket | null = null;
  private readonly messageHandlers = new Set<MessageHandler>();
  private readonly statusHandlers = new Set<StatusHandler>();
  private heartbeat: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private attempt = 0;
  private closedByClient = false;
  private readonly session: Session;

  constructor(session: Session) {
    this.session = session;
  }

  connect(): void {
    this.closedByClient = false;
    this.open();
  }

  private open(): void {
    this.setStatus(this.attempt === 0 ? "connecting" : "reconnecting");
    const socket = new WebSocket(env.gatewayWsUrl);
    this.socket = socket;

    socket.onopen = () => {
      this.attempt = 0;
      this.setStatus("connected");
      // Re-authenticate the socket so the gateway can restore session state.
      this.send({ type: "AUTH", sessionToken: this.session.sessionToken });
      this.startHeartbeat();
    };

    socket.onmessage = (event) => {
      let parsed: ServerMessage;
      try {
        parsed = JSON.parse(event.data as string) as ServerMessage;
      } catch {
        console.warn("Dropped malformed gateway message", event.data);
        return;
      }
      for (const handler of this.messageHandlers) handler(parsed);
    };

    socket.onclose = () => {
      this.stopHeartbeat();
      this.socket = null;
      if (this.closedByClient) {
        this.setStatus("disconnected");
        return;
      }
      this.scheduleReconnect();
    };

    socket.onerror = () => socket.close();
  }

  private scheduleReconnect(): void {
    this.setStatus("reconnecting");
    const backoff = Math.min(
      MAX_BACKOFF_MS,
      500 * 2 ** this.attempt + Math.random() * 250,
    );
    this.attempt += 1;
    this.reconnectTimer = setTimeout(() => this.open(), backoff);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeat = setInterval(
      () => this.send({ type: "PING" }),
      HEARTBEAT_INTERVAL_MS,
    );
  }

  private stopHeartbeat(): void {
    if (this.heartbeat) clearInterval(this.heartbeat);
    this.heartbeat = null;
  }

  private setStatus(status: ConnectionStatus): void {
    for (const handler of this.statusHandlers) handler(status);
  }

  send(message: ClientMessage): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    }
  }

  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  onStatus(handler: StatusHandler): () => void {
    this.statusHandlers.add(handler);
    return () => this.statusHandlers.delete(handler);
  }

  close(): void {
    this.closedByClient = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.stopHeartbeat();
    this.socket?.close();
  }
}

export const realGateway: Gateway = {
  async login(badge: BadgePayload): Promise<Session> {
    const res = await fetch(`${env.gatewayHttpUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(badge),
    });
    if (!res.ok) {
      throw new Error(`Login failed (${res.status})`);
    }
    return (await res.json()) as Session;
  },

  createConnection(session: Session): GatewayConnection {
    return new WebSocketConnection(session);
  },
};
