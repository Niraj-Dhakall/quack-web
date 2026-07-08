import { useGame } from "@/state/GameProvider";
import { ConnectionScreen } from "@/screens/ConnectionScreen";
import { BettingScreen } from "@/screens/BettingScreen";
import { LiveRoundScreen } from "@/screens/LiveRoundScreen";
import { ResultsScreen } from "@/screens/ResultsScreen";

function ReconnectOverlay() {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-night-950/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-night-800 px-8 py-6 ring-1 ring-white/10">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-duck" />
        <p className="font-semibold">Reconnecting…</p>
        <p className="text-sm text-white/50">Restoring your session</p>
      </div>
    </div>
  );
}

function WaitingScreen() {
  return (
    <div className="grid min-h-full place-items-center p-6 text-center text-white/60">
      <div>
        <div className="mb-3 text-5xl">🦆</div>
        <p className="font-semibold">Joined the table</p>
        <p className="text-sm">Waiting for the next round…</p>
      </div>
    </div>
  );
}

export default function App() {
  const { state } = useGame();

  let screen: React.ReactNode;
  if (!state.session) {
    screen = <ConnectionScreen />;
  } else {
    switch (state.round.status) {
      case "betting":
        screen = <BettingScreen />;
        break;
      case "spinning":
        screen = <LiveRoundScreen />;
        break;
      case "resolved":
        screen = <ResultsScreen />;
        break;
      default:
        screen = <WaitingScreen />;
    }
  }

  const showReconnect =
    state.session != null && state.status === "reconnecting";

  return (
    <div className="h-full">
      {screen}
      {showReconnect && <ReconnectOverlay />}
    </div>
  );
}
