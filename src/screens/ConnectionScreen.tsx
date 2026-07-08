import { useCallback, useState } from "react";
import { useGame } from "@/state/GameProvider";
import { StatusBadge } from "@/components/StatusBadge";
import { QrScannerView } from "@/components/QrScanner";
import { ScanQrCode } from "lucide-react";

/** Extract a player id from a scanned badge (JSON `{ player_id }` or raw text). */
function parsePlayerId(text: string): string {
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed.player_id === "string") return parsed.player_id;
  } catch {
    // Not JSON — treat the raw contents as the id.
  }
  return text.trim();
}

export function ConnectionScreen() {
  const { state, login } = useGame();
  const [playerId, setPlayerId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [scanning, setScanning] = useState(false);

  const online = typeof navigator === "undefined" ? true : navigator.onLine;

  const joinWith = useCallback(
    async (id: string) => {
      setBusy(true);
      setError(null);
      try {
        await login(id);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Login failed");
        setBusy(false);
      }
    },
    [login],
  );

  const handleDecoded = useCallback(
    (text: string) => {
      const id = parsePlayerId(text);
      if (!id) {
        setError("Couldn't read a player id from that code.");
        return;
      }
      setScanning(false);
      void joinWith(id);
    },
    [joinWith],
  );

  async function handleManualJoin() {
    // Accept a typed id or mint one to simulate a badge scan.
    await joinWith(playerId.trim() || crypto.randomUUID());
  }

  return (
    <div className="mx-auto flex min-h-full max-w-xl flex-col items-center justify-center gap-8 p-6">
      <header className="text-center">
        <h1 className="mt-2 text-3xl font-black tracking-tight text-duck">
          Quackette
        </h1>
        <p className="text-white/60">Tablet Player Terminal</p>
      </header>

      <div className="grid w-full grid-cols-2 gap-3">
        <div className=" bg-night-800/70 p-4 ring-1 ring-white/10">
          <p className="text-xs uppercase tracking-wide text-white/50">
            Table status
          </p>
          <p className="mt-1 font-semibold text-emerald-400">Table 1 · Open</p>
        </div>
        <div className=" bg-night-800/70 p-4 ring-1 ring-white/10">
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

      <div className="flex w-full flex-col items-center gap-4  bg-night-800/70 p-6 ring-1 ring-white/10">
        <div className="grid h-44 w-44 place-items-center overflow-hidden border-2 border-dashed border-duck/40 bg-night-900">
          {scanning ? (
            <QrScannerView
              onDecodedText={handleDecoded}
              onError={(msg) => {
                setError(msg);
                setScanning(false);
              }}
            />
          ) : (
            <span className="text-6xl text-duck/70">
              <ScanQrCode width={48} height={48} />
            </span>
          )}
        </div>
        <p className="text-center text-sm text-white/60">
          {scanning
            ? "Point the camera at your QR badge."
            : "Scan your QR badge to join the table."}
        </p>

        {scanning ? (
          <button
            type="button"
            onClick={() => setScanning(false)}
            className="w-full rounded-xl bg-night-900 py-3 text-lg font-bold text-white/80 ring-1 ring-white/10 transition active:scale-[0.98]"
          >
            Cancel
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setError(null);
              setScanning(true);
            }}
            disabled={busy}
            className="w-full rounded-xl bg-duck py-3 text-lg font-bold text-night-950 transition active:scale-[0.98] disabled:opacity-60"
          >
            {busy ? "Joining…" : "Scan Badge & Join"}
          </button>
        )}

        <div className="flex w-full items-center gap-3 text-xs uppercase tracking-wide text-white/30">
          <span className="h-px flex-1 bg-white/10" />
          or enter manually
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <input
          value={playerId}
          onChange={(e) => setPlayerId(e.target.value)}
          placeholder="player_id (optional for demo)"
          className="w-full rounded-xl bg-night-900 px-4 py-3 text-center text-sm ring-1 ring-white/10 outline-none focus:ring-duck/60"
        />

        <button
          type="button"
          onClick={handleManualJoin}
          disabled={busy}
          className="w-full rounded-xl bg-night-900 py-3 text-sm font-semibold text-white/80 ring-1 ring-white/10 transition active:scale-[0.98] disabled:opacity-60"
        >
          {busy ? "Joining…" : "Join without scanning"}
        </button>

        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>

      <StatusBadge status={state.status} />
    </div>
  );
}
