import type {
  BadgePayload,
  Bet,
  ClientMessage,
  LeaderboardEntry,
  Player,
  Round,
  ServerMessage,
  Session,
} from "@/types";
import type {
  Gateway,
  GatewayConnection,
  MessageHandler,
  StatusHandler,
} from "./gateway";

const BETTING_DURATION = 20;
const SPIN_DURATION_MS = 4_000;
const INTERMISSION_MS = 5_000;

function uuid(): string {
  return crypto.randomUUID();
}

function payout(bet: Bet, winningNumber: number): number {
  switch (bet.betType) {
    case "number":
      return bet.target === winningNumber ? bet.amount * 36 : 0;
    case "color": {
      const reds = new Set([
        1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
      ]);
      const color = winningNumber === 0 ? "green" : reds.has(winningNumber) ? "red" : "black";
      return bet.target === color ? bet.amount * 2 : 0;
    }
    case "parity": {
      if (winningNumber === 0) return 0;
      const parity = winningNumber % 2 === 0 ? "even" : "odd";
      return bet.target === parity ? bet.amount * 2 : 0;
    }
    case "dozen": {
      if (winningNumber === 0) return 0;
      const dozen = Math.ceil(winningNumber / 12);
      return Number(bet.target) === dozen ? bet.amount * 3 : 0;
    }
    default:
      return 0;
  }
}

/**
 * In-browser stand-in for the Go gateway + Unreal host. Runs the same event
 * loop the real backend would emit so every screen is exercisable offline.
 */
class MockConnection implements GatewayConnection {
  private readonly messageHandlers = new Set<MessageHandler>();
  private readonly statusHandlers = new Set<StatusHandler>();
  private loopTimers: ReturnType<typeof setTimeout>[] = [];
  private tickTimer: ReturnType<typeof setInterval> | null = null;
  private closed = false;

  private player: Player;
  private round: Round;
  private bets: Bet[] = [];
  private readonly leaderboard: LeaderboardEntry[];

  constructor(session: Session) {
    this.player = { ...session.player };
    this.round = { roundId: uuid(), status: "idle", timeRemaining: 0 };
    this.leaderboard = [
      { playerId: this.player.id, displayName: this.player.displayName, chips: this.player.chips, seat: this.player.seat },
      { playerId: uuid(), displayName: "QuackJagger", chips: 8200, seat: 1 },
      { playerId: uuid(), displayName: "MallardKing", chips: 6400, seat: 2 },
      { playerId: uuid(), displayName: "SirWaddles", chips: 3100, seat: 5 },
    ];
  }

  connect(): void {
    this.emitStatus("connecting");
    // Simulate a short handshake, then push a full snapshot (session recovery).
    this.schedule(() => {
      this.emitStatus("connected");
      this.emit({
        type: "STATE_SYNC",
        player: this.player,
        round: this.round,
        bets: this.bets,
        leaderboard: this.leaderboard,
      });
      this.startRound();
    }, 400);
  }

  private startRound(): void {
    if (this.closed) return;
    this.round = {
      roundId: uuid(),
      status: "betting",
      timeRemaining: BETTING_DURATION,
    };
    this.bets = [];
    this.emit({ type: "BETTING_OPEN", duration: BETTING_DURATION });

    let remaining = BETTING_DURATION;
    this.tickTimer = setInterval(() => {
      remaining -= 1;
      this.round.timeRemaining = Math.max(0, remaining);
      if (remaining <= 0) this.stopTick();
    }, 1_000);

    this.schedule(() => this.closeBetting(), BETTING_DURATION * 1_000);
  }

  private closeBetting(): void {
    if (this.closed) return;
    this.stopTick();
    this.round.status = "spinning";
    this.emit({ type: "BETTING_CLOSED" });
    this.schedule(() => this.resolveRound(), SPIN_DURATION_MS);
  }

  private resolveRound(): void {
    if (this.closed) return;
    const winningNumber = Math.floor(Math.random() * 37);
    this.round.status = "resolved";

    const winnings = this.bets.reduce(
      (sum, bet) => sum + payout(bet, winningNumber),
      0,
    );
    this.player.chips += winnings;

    this.emit({ type: "ROUND_RESULT", winningNumber });
    this.emit({ type: "PLAYER_UPDATE", chips: this.player.chips });

    const self = this.leaderboard.find((e) => e.playerId === this.player.id);
    if (self) self.chips = this.player.chips;
    this.leaderboard.sort((a, b) => b.chips - a.chips);
    this.emit({ type: "LEADERBOARD_UPDATE", entries: [...this.leaderboard] });

    this.schedule(() => this.startRound(), INTERMISSION_MS);
  }

  send(message: ClientMessage): void {
    switch (message.type) {
      case "PLACE_BET": {
        if (this.round.status !== "betting") return;
        if (message.amount > this.player.chips) return;
        this.bets.push({
          playerId: this.player.id,
          betType: message.betType,
          target: message.target,
          amount: message.amount,
        });
        this.player.chips -= message.amount;
        this.emit({ type: "PLAYER_UPDATE", chips: this.player.chips });
        break;
      }
      case "QUACK":
        // The real host plays a quack SFX; nothing to echo back here.
        break;
      case "PING":
        this.emit({ type: "PONG" });
        break;
      case "AUTH":
        break;
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
    this.closed = true;
    this.stopTick();
    for (const t of this.loopTimers) clearTimeout(t);
    this.loopTimers = [];
    this.emitStatus("disconnected");
  }

  private emit(msg: ServerMessage): void {
    if (this.closed) return;
    for (const handler of this.messageHandlers) handler(msg);
  }

  private emitStatus(status: Parameters<StatusHandler>[0]): void {
    for (const handler of this.statusHandlers) handler(status);
  }

  private schedule(fn: () => void, ms: number): void {
    this.loopTimers.push(setTimeout(fn, ms));
  }

  private stopTick(): void {
    if (this.tickTimer) clearInterval(this.tickTimer);
    this.tickTimer = null;
  }
}

const DEMO_PLAYERS: Record<string, Omit<Player, "id">> = {
  default: { displayName: "DuckLord", chips: 5000, seat: 3 },
};

export const mockGateway: Gateway = {
  async login(badge: BadgePayload): Promise<Session> {
    await new Promise((r) => setTimeout(r, 350));
    const profile = DEMO_PLAYERS.default;
    return {
      sessionToken: `mock-${uuid()}`,
      player: { id: badge.player_id || uuid(), ...profile },
    };
  },

  createConnection(session: Session): GatewayConnection {
    return new MockConnection(session);
  },
};
