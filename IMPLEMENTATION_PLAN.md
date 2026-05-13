# Implementation Plan — Twofront Technical Challenge

> Single-page app combining real-time task management with simulated Email/SMS notifications.
> Stack: Next.js 15 (App Router, TS strict), React 19 (RSC + Client Components), Zod, Tailwind.
> Deadline: 72 hours from receipt of PRD.

---

## 1. Architectural Decisions

### 1.1 Mock server: Next.js Route Handlers + in-memory store

The "mocked server" lives **inside** the Next.js app as Route Handlers (`app/api/**/route.ts`)
backed by a singleton in-memory store. The route URLs, Zod-validated request/response shapes,
and frontend code are the *real* production shape. Only the storage layer is mocked.

**Why this choice:**
- It's the idiomatic shape of a production Next.js app — no scaffolding to peel off later.
- The swap path from mock → real is mechanical: replace `lib/store.ts` (in-memory Maps) with a
  DB client (Prisma/Drizzle). API contracts, Zod schemas, and React components are untouched.
- The recurring schedulers (1-minute email, Fibonacci SMS) live in the same Node process and
  can read/write the store directly — no IPC.

**Swap path (future):**

```
[Frontend] → [Route Handler + Zod] → [in-memory Map]   ← today
[Frontend] → [Route Handler + Zod] → [Prisma/Postgres] ← later (one file changes)
```

### 1.2 Server vs Client Components

| Layer                         | Type    | Why                                                        |
|-------------------------------|---------|------------------------------------------------------------|
| `app/page.tsx` (3-panel grid) | Server  | Static shell, initial data fetch via direct store read     |
| `TasksPanel`                  | Client  | Form input, optimistic state, ticking "time age" display   |
| `EmailsPanel`                 | Client  | Polls `/api/emails` to display new arrivals                |
| `SMSPanel`                    | Client  | Polls `/api/sms` to display new arrivals                   |
| `lib/store.ts`                | Server  | Singleton — guarded via `globalThis` for dev HMR survival  |
| `lib/scheduler.ts`            | Server  | Boots once, manages 1-min email tick + Fibonacci SMS tick  |

The page is a **Server Component** that reads initial state directly and passes it as props to
the three **Client Components**. Each client panel handles its own refresh strategy from there.

### 1.3 Refresh strategy: client polling

Panels refresh by polling `/api/...` every ~2 seconds. SSE/WebSockets would be more elegant but
are out of scope for a 72-hour challenge. Documented as a "what I'd do in production" note in
the README.

### 1.4 Zod on all API boundaries

- Request bodies: `Schema.parse(await req.json())` in every POST handler.
- Response payloads: parse the outgoing object before `NextResponse.json(...)`.
- Client fetches: parse responses with the same shared schemas — single source of truth.
- Types are **inferred** from schemas (`z.infer<typeof TaskSchema>`) so no drift between
  runtime and compile-time.

### 1.5 Scheduler approach

A module-level singleton initialized on first server import. Guarded with
`globalThis.__scheduler__` to survive Next.js dev-mode HMR. State lives in memory:

```ts
{
  emailTimer: NodeJS.Timeout      // setInterval, 60s
  smsTimer:   NodeJS.Timeout      // setTimeout, reschedules using next Fibonacci minute
  fibIndex:   number              // advances each SMS send
}
```

Fibonacci cadence: `1, 1, 2, 3, 5, 8, 13, 21, ...` minutes between sends. After each send,
increment `fibIndex` and `setTimeout` for the next interval.

### 1.6 Complete-task-from-email (bonus)

Each notification email body includes an HTML link:

```
http://localhost:3000/api/tasks/{id}/complete?token={hmac}
```

Token is `HMAC-SHA256(taskId, secret)`. The handler verifies the token, marks the task
complete, and returns an HTML confirmation page. This avoids needing a session — a stale or
guessed link can't complete arbitrary tasks.

### 1.7 Playwright (bonus)

Page Object Model. One happy-path lifecycle test:
1. Open `/`.
2. Add a task via the input.
3. Assert an immediate email appears in the Emails panel.
4. Click the complete-from-email link inside the test (or click the task's Complete button).
5. Assert the task moves to the completed list.

The recurring 1-min email and Fibonacci SMS waits are too slow for CI; tested manually and
documented. (Optionally: a "test mode" env var that shortens intervals to seconds.)

---

## 2. Phased Build — One Commit (or Small Cluster) per Phase

The PRD submission checklist requires a *descriptive commit history, not one giant commit*.
Each phase below ends in a logical commit boundary. Commit messages use conventional-commit
prefixes (`feat:`, `chore:`, `docs:`, `test:`).

### Phase 0 — Repo bootstrap & docs

- [ ] Create empty public repo on GitHub (user does this manually).
- [ ] `git init` locally, add `origin`, set default branch to `main`.
- [ ] Commit `IMPLEMENTATION_PLAN.md` (this file) and a skeleton `README.md`.
- [ ] Add `.gitignore` (Node, Next.js, IDE).

**Commit:** `docs: add implementation plan and readme skeleton`

### Phase 1 — Next.js 15 scaffold

- [ ] `npx create-next-app@latest . --typescript --tailwind --app --src-dir=false --import-alias='@/*'`.
- [ ] Verify `tsconfig.json` has `"strict": true`.
- [ ] Install `zod`.
- [ ] Replace `app/page.tsx` with a three-column CSS grid scaffold (Tasks | Emails | SMS).
- [ ] Smoke-test: `npm run dev` shows three empty labeled panels.

**Commit:** `chore: scaffold Next.js 15 + Tailwind with three-panel layout`

### Phase 2 — Domain schemas & store

- [ ] `lib/schemas.ts`:
  - `TaskSchema` — `{ id, title, createdAt, completedAt?: }`
  - `EmailSchema` — `{ id, subject, body, createdAt, kind: 'immediate' | 'recurring', taskId?: }`
  - `SmsSchema` — `{ id, body, createdAt }`
  - `CreateTaskInputSchema` — `{ title: z.string().min(1).max(200) }`
- [ ] `lib/store.ts` — singleton via `globalThis.__store__`:
  - `tasks: Map<string, Task>`
  - `emails: Email[]`
  - `sms: Sms[]`
  - Helpers: `addTask`, `completeTask`, `listTasks`, `addEmail`, `listEmails`, `addSms`, `listSms`.

**Commit:** `feat: zod schemas and in-memory store`

### Phase 3 — Tasks API + Tasks panel

- [ ] `app/api/tasks/route.ts` — `GET` (list), `POST` (create, Zod-validated).
- [ ] `app/api/tasks/[id]/complete/route.ts` — `POST` (mark complete).
- [ ] `components/TasksPanel.tsx` (client):
  - Add-task form.
  - Pending list with title, live-updating "time age" (`useEffect` ticker, hydration-safe).
  - Complete button per row.
  - Completed list with completion timestamp.
- [ ] Page passes initial tasks from server to `TasksPanel`.
- [ ] Polling every 2s to keep the list fresh (mostly a no-op until scheduler is added).

**Commit:** `feat(tasks): api routes and tasks panel`

### Phase 4 — Emails: immediate + recurring summary

- [ ] `lib/scheduler.ts` — singleton boot:
  - `setInterval(emailSummaryTick, 60_000)` — pushes a recurring email iff pending tasks exist.
  - Exposed `triggerImmediateEmail(task)` used by the task `POST` handler.
- [ ] `app/api/emails/route.ts` — `GET` (list, newest first).
- [ ] `components/EmailsPanel.tsx` (client) — list with subject, body, formatted timestamp; polls every 2s.
- [ ] Import scheduler from a server-only module that runs at app startup (e.g. instrumentation hook or first request side-effect).

**Commit:** `feat(emails): immediate notification + 1-minute recurring summary`

### Phase 5 — SMS: Fibonacci recurring

- [ ] Extend `lib/scheduler.ts` with `scheduleNextSms()`:
  - Maintain `fibIndex`.
  - `setTimeout(sendSms, fib(fibIndex) * 60_000)`; on fire, send + `fibIndex++` + reschedule.
- [ ] `app/api/sms/route.ts` — `GET` (list, newest first).
- [ ] `components/SmsPanel.tsx` (client) — list with body + timestamp; polls every 2s.

**Commit:** `feat(sms): fibonacci-cadence recurring summary`

### Phase 6 — Bonus: complete-task-from-email

- [ ] `lib/tokens.ts` — `signTaskToken(id)` / `verifyTaskToken(id, token)` using HMAC-SHA256.
- [ ] Update email body builder to include a styled `<a>` button:
  `${BASE_URL}/api/tasks/${id}/complete?token=${signed}`.
- [ ] Extend `app/api/tasks/[id]/complete/route.ts` to also accept `GET ?token=...`:
  - Verify token → complete task → return HTML confirmation page.

**Commit:** `feat(bonus): complete task via signed email link`

### Phase 7 — Bonus: Playwright integration test (POM)

- [ ] `npm i -D @playwright/test` + `npx playwright install --with-deps`.
- [ ] `playwright.config.ts` — webServer launches `npm run dev`.
- [ ] `tests/pages/HomePage.ts` — page object with locators + actions (`addTask`, `completePending`).
- [ ] `tests/pages/EmailsPanel.ts`, `tests/pages/SmsPanel.ts`.
- [ ] `tests/lifecycle.spec.ts`:
  - Add task → assert immediate email appears with subject containing task title.
  - Click complete → assert task moves to Completed list.
  - (Optional) Visit the email's action link to test round-trip.

**Commit:** `test(e2e): playwright POM lifecycle test`

### Phase 8 — README polish

- [ ] Expand README:
  - How to run (`npm i`, `npm run dev`, `npm run test:e2e`).
  - Architecture diagram (ASCII).
  - Server vs Client Component split (with rationale).
  - Scheduler design notes (singleton + globalThis guard).
  - Mock → real swap path.
  - Bonuses implemented.
  - Known limitations / future work (SSE, persistence, auth).

**Commit:** `docs: complete readme with architecture and run instructions`

### Phase 9 — Final pass

- [ ] `npm run build` — must pass with no TS errors, no warnings.
- [ ] `npm run lint` — clean.
- [ ] Review `git log --oneline` — every commit message reads clearly.
- [ ] Push to `main`. Send link to `juan@mytwofront.com`.

**Commit:** *(no code commit — final check only)*

---

## 3. Risks & Mitigations

| Risk                                                          | Mitigation                                                              |
|---------------------------------------------------------------|-------------------------------------------------------------------------|
| Scheduler dies on Next.js dev HMR                             | `globalThis.__scheduler__` guard; reload-safe singleton                 |
| Hydration mismatch on "time age" string                       | Render age client-only via `useEffect`; SSR shows static timestamp      |
| Polling overhead                                              | 2s interval is fine for 3 panels; document SSE as production upgrade    |
| Playwright tests too slow if waiting full 1-min intervals     | Cover immediate email + task completion; document scheduler tests manually |
| Zod schema drift between client & server                      | Both import from `lib/schemas.ts` — single source                       |
| Forgetting to commit incrementally                            | Commit at the end of each phase; never skip                             |

---

## 4. Out of Scope

- Auth / multi-user — single anonymous user.
- Persistence across server restart — in-memory by design.
- Real email/SMS providers — simulated only, per PRD.
- Mobile-specific layout — desktop-first; basic Tailwind responsive grid.
- Internationalization, accessibility audit beyond semantic HTML and labels.

---

## 5. Submission Checklist (from PRD §5)

- [ ] Public GitHub repository.
- [ ] Descriptive commit history (one commit per phase above — **not** one giant commit).
- [ ] README with setup instructions, architecture notes, and trade-offs.
- [ ] Repository link emailed to `juan@mytwofront.com` before the 72-hour deadline.
