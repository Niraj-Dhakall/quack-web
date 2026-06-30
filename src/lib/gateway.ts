import type {
  BadgePayload,
  ClientMessage,
  ConnectionStatus,
  ServerMessage,
  Session,
} from "@/types";

export type MessageHandler = (msg: ServerMessage) => void;
export type StatusHandler = (status: ConnectionStatus) => void;

/**
 * Transport-agnostic gateway connection. Both the real WebSocket transport and
 * the in-browser mock implement this so screens never depend on the backend.
 */
export interface GatewayConnection {
  connect(): void;
  close(): void;
  send(message: ClientMessage): void;
  onMessage(handler: MessageHandler): () => void;
  onStatus(handler: StatusHandler): () => void;
}

export interface Gateway {
  /** Authenticate a scanned badge and create a session. */
  login(badge: BadgePayload): Promise<Session>;
  /** Open a realtime connection for an authenticated session. */
  createConnection(session: Session): GatewayConnection;
}
