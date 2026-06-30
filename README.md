# Quackette Tablet — Frontend

Player-facing tablet client for the Quackette casino experience. See
[`Project.md`](./Project.md) for the full technical design document.

This is the **tablet frontend** only. The authoritative game logic lives in
Unreal Engine, fronted by a Go gateway over WebSockets. The frontend never
computes outcomes — it renders state and forwards player input.

## Stack

- React 19 + TypeScript
- Vite
- TanStack Query (HTTP / session lifecycle)
- Native WebSocket API (realtime game events)
- Tailwind CSS v4

## Getting started

```bash
npm install
cp .env.example .env   # adjust gateway URLs as needed
npm run dev
```

Open http://localhost:5173.

By default the app runs against an **in-browser mock gateway**
(`VITE_USE_MOCK=true`) that simulates the full Unreal-driven round loop —
betting open → closed → spin → result → leaderboard — so every screen is usable
without a backend. Set `VITE_USE_MOCK=false` and point `VITE_GATEWAY_*` at the
real Go gateway to go live.

## Scripts

| Command             | Description                          |
| ------------------- | ------------------------------------ |
| `npm run dev`       | Start the Vite dev server            |
| `npm run build`     | Type-check and build for production   |
| `npm run preview`   | Preview the production build         |
| `npm run typecheck` | Type-check without emitting          |

## Project structure

```
src/
  components/   Reusable UI (board, chip count, status, leaderboard)
  lib/          Gateway transport (real WS + mock), env, helpers
  screens/      Connection, Betting, Live Round, Results
  state/        Game reducer + provider (connection + game state)
  types/        Data models + WebSocket message contracts
```

## How it maps to the design doc

- **Authentication** — `ConnectionScreen` simulates a QR badge scan and calls
  `gateway.login({ player_id })`.
- **WebSocket events** — typed in `src/types`, handled in `src/state`.
- **Session recovery** — `realGateway` reconnects with backoff and re-sends
  `AUTH`; the gateway replies with a `STATE_SYNC` snapshot. A reconnect overlay
  is shown while this happens.
- **Screens** — routed in `App.tsx` based on connection + round status.
# quack-web
