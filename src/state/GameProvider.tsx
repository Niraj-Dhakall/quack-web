import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { gateway } from "@/lib/gatewayClient";
import type { GatewayConnection } from "@/lib/gateway";
import type { BetType, ServerMessage } from "@/types";
import { gameReducer, initialState, type GameState } from "./gameReducer";

interface GameContextValue {
  state: GameState;
  /** Live betting countdown in seconds (derived locally from the deadline). */
  secondsLeft: number;
  login: (playerId: string) => Promise<void>;
  placeBet: (bet: {
    betType: BetType;
    target: number | string;
    amount: number;
  }) => void;
  quack: () => void;
  logout: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const connectionRef = useRef<GatewayConnection | null>(null);
  const deadlineRef = useRef<number | null>(null);

  const handleServerMessage = useCallback((message: ServerMessage) => {
    if (message.type === "BETTING_OPEN") {
      deadlineRef.current = Date.now() + message.duration * 1000;
    } else if (message.type === "BETTING_CLOSED") {
      deadlineRef.current = null;
    } else if (
      message.type === "STATE_SYNC" &&
      message.round.status === "betting"
    ) {
      deadlineRef.current = Date.now() + message.round.timeRemaining * 1000;
    }
    dispatch({ type: "SERVER_MESSAGE", message });
  }, []);

  // Single ticker drives the visible betting countdown from the deadline.
  useEffect(() => {
    const id = setInterval(() => {
      if (deadlineRef.current == null) {
        setSecondsLeft(0);
        return;
      }
      const remaining = Math.max(
        0,
        Math.ceil((deadlineRef.current - Date.now()) / 1000),
      );
      setSecondsLeft(remaining);
    }, 250);
    return () => clearInterval(id);
  }, []);

  const login = useCallback(
    async (playerId: string) => {
      const session = await gateway.login({ player_id: playerId });
      dispatch({ type: "SESSION_ESTABLISHED", session });

      const connection = gateway.createConnection(session);
      connectionRef.current = connection;
      connection.onStatus((status) =>
        dispatch({ type: "CONNECTION_STATUS", status }),
      );
      connection.onMessage(handleServerMessage);
      connection.connect();
    },
    [handleServerMessage],
  );

  const placeBet = useCallback<GameContextValue["placeBet"]>(
    (bet) => {
      const player = state.player;
      if (!player) return;
      connectionRef.current?.send({ type: "PLACE_BET", ...bet });
    },
    [state.player],
  );

  const quack = useCallback(() => {
    connectionRef.current?.send({ type: "QUACK" });
  }, []);

  const logout = useCallback(() => {
    connectionRef.current?.close();
    connectionRef.current = null;
    deadlineRef.current = null;
    dispatch({ type: "RESET" });
  }, []);

  useEffect(() => {
    return () => connectionRef.current?.close();
  }, []);

  const value = useMemo<GameContextValue>(
    () => ({ state, secondsLeft, login, placeBet, quack, logout }),
    [state, secondsLeft, login, placeBet, quack, logout],
  );

  return <GameContext value={value}>{children}</GameContext>;
}

export function useGame(): GameContextValue {
  const ctx = use(GameContext);
  if (!ctx) throw new Error("useGame must be used within a GameProvider");
  return ctx;
}
