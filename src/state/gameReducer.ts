import type {
  Bet,
  ConnectionStatus,
  LeaderboardEntry,
  Player,
  Round,
  ServerMessage,
  Session,
} from "@/types";

export interface GameState {
  status: ConnectionStatus;
  session: Session | null;
  player: Player | null;
  round: Round;
  bets: Bet[];
  leaderboard: LeaderboardEntry[];
  lastWinningNumber: number | null;
  /** Chips when the current round's betting opened, to compute round profit/loss. */
  chipsAtRoundStart: number | null;
}

export const initialRound: Round = {
  roundId: "",
  status: "idle",
  timeRemaining: 0,
};

export const initialState: GameState = {
  status: "disconnected",
  session: null,
  player: null,
  round: initialRound,
  bets: [],
  leaderboard: [],
  lastWinningNumber: null,
  chipsAtRoundStart: null,
};

export type GameAction =
  | { type: "SESSION_ESTABLISHED"; session: Session }
  | { type: "CONNECTION_STATUS"; status: ConnectionStatus }
  | { type: "SERVER_MESSAGE"; message: ServerMessage }
  | { type: "LOCAL_BET"; bet: Bet }
  | { type: "RESET" };

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "SESSION_ESTABLISHED":
      return {
        ...state,
        session: action.session,
        player: action.session.player,
      };

    case "CONNECTION_STATUS":
      return { ...state, status: action.status };

    case "LOCAL_BET":
      return { ...state, bets: [...state.bets, action.bet] };

    case "RESET":
      return initialState;

    case "SERVER_MESSAGE":
      return applyServerMessage(state, action.message);

    default:
      return state;
  }
}

function applyServerMessage(state: GameState, msg: ServerMessage): GameState {
  switch (msg.type) {
    case "STATE_SYNC":
      return {
        ...state,
        player: msg.player,
        round: msg.round,
        bets: msg.bets,
        leaderboard: msg.leaderboard ?? state.leaderboard,
      };

    case "PLAYER_UPDATE":
      return {
        ...state,
        player: state.player
          ? { ...state.player, chips: msg.chips }
          : state.player,
      };

    case "BETTING_OPEN":
      return {
        ...state,
        bets: [],
        lastWinningNumber: null,
        chipsAtRoundStart: state.player?.chips ?? null,
        round: {
          ...state.round,
          status: "betting",
          timeRemaining: msg.duration,
        },
      };

    case "BETTING_CLOSED":
      return {
        ...state,
        round: { ...state.round, status: "spinning", timeRemaining: 0 },
      };

    case "ROUND_RESULT":
      return {
        ...state,
        round: { ...state.round, status: "resolved" },
        lastWinningNumber: msg.winningNumber,
      };

    case "LEADERBOARD_UPDATE":
      return {
        ...state,
        leaderboard: msg.entries ?? state.leaderboard,
      };

    case "PONG":
      return state;

    default:
      return state;
  }
}
