import { useState } from "react";
import { useGame } from "@/state/GameProvider";
import { StatusBadge } from "@/components/StatusBadge";

export function ConnectionScreen() {
  const { state, login } = useGame();
  const [playerId, setPlayerId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const online = typeof navigator === "undefined" ? true : navigator.onLine;

  async function handleScan() {
    setBusy(true);
    setError(null);
    try {
      // A real tablet decodes { "player_id": "uuid" } from the camera; here we
      // accept a typed id or mint one to simulate a badge scan.
      await login(playerId.trim() || crypto.randomUUID());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-full max-w-xl flex-col items-center justify-center gap-8 p-6">
      <header className="text-center">
        <div className="text-5xl">🦆</div>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-duck">
          Quackette
        </h1>
        <p className="text-white/60">Tablet Player Terminal</p>
      </header>

      <div className="grid w-full grid-cols-2 gap-3">
        <div className="rounded-2xl bg-night-800/70 p-4 ring-1 ring-white/10">
          <p className="text-xs uppercase tracking-wide text-white/50">
            Table status
          </p>
          <p className="mt-1 font-semibold text-emerald-400">Table 1 · Open</p>
        </div>
        <div className="rounded-2xl bg-night-800/70 p-4 ring-1 ring-white/10">
          <p className="text-xs uppercase tracking-wide text-white/50">
            Network
          </p>
          <p
            className={
              "mt-1 font-semibold " +
              (online ? "text-emerald-400" : "text-red-400")
            }
          >
            {online ? "Online" : "Offline"}
          </p>
        </div>
      </div>

      <div className="flex w-full flex-col items-center gap-4 rounded-3xl bg-night-800/70 p-6 ring-1 ring-white/10">
        <div className="grid h-44 w-44 place-items-center rounded-2xl border-2 border-dashed border-duck/40 bg-night-900">
          <span className="text-6xl">🔳</span>
        </div>
        <p className="text-center text-sm text-white/60">
          Scan your QR badge to join the table.
        </p>

        <input
          value={playerId}
          onChange={(e) => setPlayerId(e.target.value)}
          placeholder="player_id (optional for demo)"
          className="w-full rounded-xl bg-night-900 px-4 py-3 text-center text-sm ring-1 ring-white/10 outline-none focus:ring-duck/60"
        />

        <button
          type="button"
          onClick={handleScan}
          disabled={busy}
          className="w-full rounded-xl bg-duck py-3 text-lg font-bold text-night-950 transition active:scale-[0.98] disabled:opacity-60"
        >
          {busy ? "Joining…" : "Scan Badge & Join"}
        </button>

        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>

      <StatusBadge status={state.status} />
    </div>
  );
}
