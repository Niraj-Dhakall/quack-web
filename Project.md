# Quackette Tablet Platform — Technical Design Document

## Overview

The Quackette Tablet Platform provides a secondary interface for players participating in the Quackette casino experience. Players interact with the game through dedicated tablets while the primary game simulation and visual presentation run inside Unreal Engine.

The system is designed around an event-driven architecture where Unreal Engine serves as the authoritative game server and tablet clients act as lightweight interfaces for player input and game information.

### Goals

- Real-time player interaction
- Low-latency communication
- Multi-player support
- Event-friendly deployment
- Device independence
- Scalability for future casino games

---

## System Architecture

### High-Level Design

```text
┌─────────────────────────────┐
│     Unreal Engine Host      │
│                             │
│  - Game Logic               │
│  - Physics Simulation       │
│  - Chip Accounting          │
│  - Match State              │
│  - Round Resolution         │
└──────────────┬──────────────┘
               │
        WebSocket Events
               │
┌──────────────▼──────────────┐
│       Gateway Server        │
│                             │
│  - Session Management       │
│  - Authentication           │
│  - Device Tracking          │
│  - Event Routing            │
│  - Logging                  │
└──────┬───────┬───────┬──────┘
       │       │       │
       ▼       ▼       ▼

 Tablet 1  Tablet 2  Tablet N
```

Key principles:

- The Unreal Engine instance remains the source of truth.
- The tablet application never calculates game outcomes.
- All game state originates from Unreal.

---

## Technology Stack

### Tablet Frontend

- React
- TypeScript
- Vite
- TanStack Query
- WebSocket API
- Tailwind CSS

**Responsibilities**

- Player interface
- Betting controls
- Chip display
- Quack controls
- Live game updates

### Gateway Backend

- Go

**Suggested Libraries**

- Gin
- Gorilla WebSocket
- PostgreSQL
- UUID

**Responsibilities**

- Session management
- Player authentication
- Tablet registration
- Message routing
- Audit logging

### Game Layer

- Unreal Engine

**Responsibilities**

- Game simulation
- Wheel physics
- Round state
- Outcome resolution
- Economy calculations

---

## Authentication Flow

### QR Badge Login

Each player receives a QR code badge.

**Structure**

```json
{
  "player_id": "uuid"
}
```

**Login Process**

1. Player scans QR code
2. Tablet sends login request
3. Gateway validates player
4. Session created
5. Tablet receives session token
6. Tablet joins active table

---

## Core Data Models

### Player

```json
{
  "id": "uuid",
  "displayName": "DuckLord",
  "chips": 5000,
  "seat": 3
}
```

### Bet

```json
{
  "playerId": "uuid",
  "betType": "number",
  "target": 17,
  "amount": 100
}
```

### Round

```json
{
  "roundId": "uuid",
  "status": "betting",
  "timeRemaining": 20
}
```

---

## WebSocket Events

### Client → Server

**Place Bet**

```json
{
  "type": "PLACE_BET",
  "betType": "number",
  "target": 17,
  "amount": 100
}
```

**Trigger Quack**

```json
{
  "type": "QUACK"
}
```

**Heartbeat**

```json
{
  "type": "PING"
}
```

### Server → Client

**Player State Update**

```json
{
  "type": "PLAYER_UPDATE",
  "chips": 4700
}
```

**Betting Open**

```json
{
  "type": "BETTING_OPEN",
  "duration": 20
}
```

**Betting Closed**

```json
{
  "type": "BETTING_CLOSED"
}
```

**Round Result**

```json
{
  "type": "ROUND_RESULT",
  "winningNumber": 17
}
```

**Leaderboard Update**

```json
{
  "type": "LEADERBOARD_UPDATE"
}
```

---

## Frontend Screens

### Connection Screen

**Displays**

- Table status
- Network status
- QR scanner

### Betting Screen

**Displays**

- Current chip count
- Roulette board
- Active bets
- Remaining betting time

**Actions**

- Add bet
- Remove bet
- Confirm bet

### Live Round Screen

**Displays**

- Wheel animation state
- Current round status
- Quack button

**Actions**

- Trigger quack

### Results Screen

**Displays**

- Winning number
- Profit/loss
- Updated chip count

---

## Session Recovery

**Requirements**

- Automatic reconnect
- Session persistence
- State resynchronization

**Workflow**

1. Connection lost
2. Client reconnects
3. Session token sent
4. Gateway restores state
5. Current game state pushed to tablet

---

