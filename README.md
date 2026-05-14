# Task Manager — Real-time notifications via Email & SMS

A single-page app that combines real-time task management with simulated multi-channel
notifications. Add a task and an email fires instantly; a recurring email summary arrives
every minute; SMS summaries follow a Fibonacci-minute cadence (1, 1, 2, 3, 5, 8… min).
All three panels are visible simultaneously — no routing.

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 15 (App Router) | Server + Client Components used deliberately |
| Language | TypeScript — strict mode | Compile-time + runtime safety |
| UI library | React 19 | Server Components for shell, Client for interactivity |
| Validation | Zod | Runtime schema validation at every API boundary |
| Styling | Tailwind CSS | Utility-first, no extra build step |
| Testing | Playwright + Page Object Model | Full lifecycle E2E coverage |

---

## Running with Docker

No Node.js installation required — just Docker.

```bash
docker compose up --build
```

Open [http://localhost:3000](http://localhost:3000). That's it.

> The image uses a 3-stage build (`deps → builder → runner`) with Next.js
> `output: "standalone"` so the final layer contains only what's needed to run.

### Running tests with Docker

**Unit tests** (no browser needed):

```bash
docker compose --profile test-unit run --rm test-unit
```

**E2E tests** (Playwright + Chromium, fully in Docker — no Node.js required):

```bash
docker compose --profile test-e2e up --build --exit-code-from test-e2e
```

This starts a dedicated app instance with the fast SMS cadence (`TEST_SMS_INTERVAL_MS=3000`),
waits for it to be healthy, runs all 6 Playwright tests, then exits with Playwright's exit code.

Tear down after the run:

```bash
docker compose --profile test-e2e down
```

---

## Getting Started (local dev)

```bash
# 1. Install dependencies
npm install

# 2. (First time only) Install Playwright browser
npx playwright install chromium

# 3. Start the dev server
npm run dev        # → http://localhost:3000

# 4. Run E2E tests (requires dev server or starts one automatically)
npm run test:e2e

# 5. Production build check
npm run build
```

### Optional environment variables

| Variable | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_BASE_URL` | `http://localhost:3000` | Base URL embedded in email action links |
| `TOKEN_SECRET` | `dev-secret-change-in-production` | HMAC key for task completion tokens |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  app/page.tsx  (Server Component — static three-panel shell) │
│  ┌────────────────┬────────────────┬────────────────┐        │
│  │  TasksPanel    │  EmailsPanel   │  SmsPanel      │        │
│  │  (Client)      │  (Client)      │  (Client)      │        │
│  └───────┬────────┴───────┬────────┴────────┬───────┘        │
│          │   poll /api/… every 2 s           │               │
│  ┌───────▼────────────────▼─────────────────▼───────┐        │
│  │  Route Handlers  app/api/**  (Zod-validated)      │        │
│  └───────────────────────┬───────────────────────────┘        │
│  ┌──────────────────────────────────────────────────┐         │
│  │  lib/store.ts  — in-memory singleton (swap→ DB)  │         │
│  └──────▲──────────────────────────────────────┬────┘         │
│         │  reads/writes                        │              │
│  ┌──────┴──────────────────────────────────────┐              │
│  │  lib/scheduler.ts  — singleton timers        │              │
│  │  • setInterval 60 s  → recurring email       │              │
│  │  • setTimeout fib(n) min → Fibonacci SMS     │              │
│  └──────────────────────────────────────────────┘              │
└──────────────────────────────────────────────────────────────┘
```

### Server vs Client Components

| Component | Type | Reason |
|---|---|---|
| `app/page.tsx` | Server | Static layout shell; no client state needed |
| `TasksPanel` | Client | Form input, live time-age ticker, mutations |
| `EmailsPanel` | Client | Polling, dynamic list updates |
| `SmsPanel` | Client | Polling, dynamic list updates |
| `lib/store.ts` | Server-only | `import "server-only"` — guards against accidental client import |
| `lib/scheduler.ts` | Server-only | Timer singleton; must not run in the browser |

### Scheduler design

`startScheduler()` is called the first time a task is created (inside `triggerImmediateEmail`),
so the 60-second recurring-email interval begins from when the user actually has work to track.
A `globalThis.__scheduler__` guard prevents double-initialisation on subsequent task adds and
dev-mode HMR reloads.

```
startScheduler()
  ├── setInterval(emailTick, 60_000)      // recurring email every 60 s
  └── scheduleNextSms(state)              // kicks off the Fibonacci chain
        └── setTimeout(smsTick, fib(n) × 60_000)
              └── on fire: send SMS → smsFibIndex++ → scheduleNextSms(state)
```

Fibonacci sequence of delays: **1, 1, 2, 3, 5, 8, 13, 21 …** minutes.

### Zod on all API boundaries

- **Incoming** — every `POST` body is `.safeParse()`d before the handler logic runs.
- **Outgoing** — response shapes match the exported Zod schemas.
- **Client** — every `fetch()` response is parsed with `z.array(Schema).safeParse()`
  before updating state. A parse failure silently no-ops rather than crashing the UI.
- **Types** — all TypeScript types are `z.infer<typeof Schema>`, so runtime and
  compile-time definitions can never drift apart.

---

## Features

### Core

- [x] Tasks panel — add task, live time-age on pending rows, Complete button, completed list with timestamp.
- [x] Emails panel — immediate notification on task add + 1-minute recurring summary.
- [x] SMS panel — recurring summary on Fibonacci-minute cadence.

### Extras

- [x] Complete-task-from-email — each notification email contains a signed "Complete Task →" action link. Clicking it verifies an HMAC-SHA256 token and marks the task complete without requiring a session.
- [x] Playwright integration test (Page Object Model) — three lifecycle scenarios: add→email, complete via button, complete via email link round-trip.

---

## Mock → Real swap path

The mock server is the **production shape**. Route Handlers, Zod schemas, and frontend
code are identical to what a real deployment would use. Only `lib/store.ts` is mocked.

To swap to a real database:

```
# 1. Install your DB client
npm install @prisma/client   # or drizzle-orm, etc.

# 2. Replace lib/store.ts with DB calls
#    All exported function signatures stay the same:
#    addTask(), completeTask(), listTasks(), addEmail(), …

# 3. Nothing else changes — route handlers, schemas, components
#    and tests are all unaffected.
```

---

## Implementation Notes

The original thinking process — architectural decisions, phase-by-phase build plan, risk
mitigations, and trade-off rationale — is captured in
[IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md).

---

## Trade-offs & Future Work

| Decision | What was chosen | Production upgrade |
|---|---|---|
| Real-time | Client polling every 2 s | Server-Sent Events or WebSockets |
| Persistence | In-memory (resets on restart) | Postgres + Prisma/Drizzle |
| Auth | None — single anonymous user | NextAuth or Clerk |
| Scheduler | `setInterval` singleton in Node process | BullMQ, Inngest, or Vercel Cron |
| SMS intervals | Fibonacci minutes (1, 1, 2, 3, 5…) | Configurable via env or UI |
| E2E timers | 1-min email + Fibonacci SMS not tested in CI | Reduce intervals via `TEST_MODE` env var |
