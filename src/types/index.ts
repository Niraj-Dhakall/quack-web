// ---------------------------------------------------------------------------
// Core data models (mirror of the gateway / Unreal authoritative state)
// ---------------------------------------------------------------------------

export type UUID = string;

export interface Player {
  id: UUID;
  displayName: string;
  chips: number;
  seat: number;
}

export type BetType = "number" | "color" | "parity" | "dozen";

export interface Bet {
  playerId: UUID;
  betType: BetType;
  target: number | string;
  amount: number;
}

export type RoundStatus = "idle" | "betting" | "spinning" | "resolved";

export interface Round {
  roundId: UUID;
  status: RoundStatus;
  timeRemaining: number;
}

export interface LeaderboardEntry {
  playerId: UUID;
  displayName: string;
  chips: number;
  seat: number;
}

// ---------------------------------------------------------------------------
// QR badge payload
// ---------------------------------------------------------------------------

export interface BadgePayload {
  player_id: UUID;
}

// ---------------------------------------------------------------------------
// WebSocket protocol: Client -> Server
// ---------------------------------------------------------------------------

export interface PlaceBetMessage {
  type: "PLACE_BET";
  betType: BetType;
  target: number | string;
  amount: number;
}

export interface QuackMessage {
  type: "QUACK";
}

export interface PingMessage {
  type: "PING";
}

/** Sent immediately after (re)connecting to (re)authenticate the socket. */
export interface AuthMessage {
  type: "AUTH";
  sessionToken: string;
}

export type ClientMessage =
  | PlaceBetMessage
  | QuackMessage
  | PingMessage
  | AuthMessage;

// ---------------------------------------------------------------------------
// WebSocket protocol: Server -> Client
// ---------------------------------------------------------------------------

export interface PlayerUpdateMessage {
  type: "PLAYER_UPDATE";
  chips: number;
}

export interface BettingOpenMessage {
  type: "BETTING_OPEN";
  duration: number;
}

export interface BettingClosedMessage {
  type: "BETTING_CLOSED";
}

export interface RoundResultMessage {
  type: "ROUND_RESULT";
  winningNumber: number;
}

export interface LeaderboardUpdateMessage {
  type: "LEADERBOARD_UPDATE";
  entries?: LeaderboardEntry[];
}

/** Full state snapshot pushed on (re)connect for session recovery. */
export interface StateSyncMessage {
  type: "STATE_SYNC";
  player: Player;
  round: Round;
  bets: Bet[];
  leaderboard?: LeaderboardEntry[];
}

export interface PongMessage {
  type: "PONG";
}

export type ServerMessage =
  | PlayerUpdateMessage
  | BettingOpenMessage
  | BettingClosedMessage
  | RoundResultMessage
  | LeaderboardUpdateMessage
  | StateSyncMessage
  | PongMessage;

// ---------------------------------------------------------------------------
// Connection lifecycle
// ---------------------------------------------------------------------------

export type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "reconnecting";

export interface Session {
  sessionToken: string;
  player: Player;
}
