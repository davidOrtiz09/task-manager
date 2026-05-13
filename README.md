# Task Manager — Real-time notifications via Email & SMS

Single-page app combining real-time task management with simulated Email/SMS notifications.

> **Status:** scaffolding. See [`IMPLEMENTATION_PLAN.md`](./IMPLEMENTATION_PLAN.md) for the full
> build plan, phased commits, and architectural decisions.

---

## Tech Stack

- **Next.js 15** (App Router) — Server & Client Components used deliberately.
- **TypeScript** — strict mode.
- **React 19**.
- **Zod** — runtime validation at every API boundary (request + response + client parse).
- **Tailwind CSS**.
- **Playwright** — E2E integration test using the Page Object Model (bonus).

---

## Getting Started

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # production build (must pass clean)
npm run test:e2e     # Playwright lifecycle test
```

---

## Architecture (preview — fully written up in Phase 8)

```
┌───────────────────────────────────────────────────────────┐
│  app/page.tsx  (Server Component — three-panel grid)      │
│  ┌───────────────┬───────────────┬───────────────┐        │
│  │ TasksPanel    │ EmailsPanel   │ SmsPanel      │        │
│  │ (client)      │ (client)      │ (client)      │        │
│  └───────┬───────┴───────┬───────┴───────┬───────┘        │
│          │ poll /api/... every 2s                          │
│  ┌───────▼───────────────▼───────────────▼───────┐        │
│  │  Route Handlers (app/api/**)  — Zod-validated │        │
│  └───────────────────┬───────────────────────────┘        │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  lib/store.ts  (in-memory singleton — swap for DB)  │  │
│  └────▲──────────────────────────────────────────────┬─┘  │
│       │                                              │    │
│  ┌────┴─────────────────────────────────────────────┐│    │
│  │  lib/scheduler.ts  (1-min email + Fibonacci SMS) ││    │
│  └──────────────────────────────────────────────────┘│    │
└───────────────────────────────────────────────────────────┘
```

The mock server is the *production* shape: Route Handlers + Zod schemas + a storage layer.
Replacing `lib/store.ts` with a real database client is the only change required to ship
this app on real infrastructure. See `IMPLEMENTATION_PLAN.md` §1.1 for details.

---

## Features

### Core

- [ ] Tasks panel — add, list pending, complete, list completed.
- [ ] Emails panel — immediate notification on add + 1-minute recurring summary.
- [ ] SMS panel — recurring summary on Fibonacci-minute cadence.

### Extras

- [ ] Complete-task-from-email — signed link in each notification.
- [ ] Playwright integration test (Page Object Model).

---

## Trade-offs & Future Work

To be expanded in Phase 8 (see `IMPLEMENTATION_PLAN.md`).

Highlights:
- **Polling** chosen over SSE/WebSockets for simplicity. SSE is the production upgrade.
- **In-memory store** dies on server restart. Persistence is a one-file swap.
- **HMAC tokens** on email links avoid needing a session for the round-trip bonus.
