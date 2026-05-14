import "server-only";
import { addEmail, addSms, listTasks } from "./store";
import { signTaskToken } from "./tokens";
import type { Task } from "./schemas";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

interface SchedulerState {
  emailIntervalId: ReturnType<typeof setInterval>;
  smsTimeoutId: ReturnType<typeof setTimeout> | null;
  smsFibIndex: number;
}

declare global {
  var __scheduler__: SchedulerState | undefined;
}

function fib(n: number): number {
  if (n <= 1) return 1;
  let a = 1, b = 1;
  for (let i = 2; i <= n; i++) [a, b] = [b, a + b];
  return b;
}

function pendingTasks() {
  return listTasks().filter((t) => !t.completedAt);
}

function sendRecurringSummaryEmail() {
  const pending = pendingTasks();
  if (pending.length === 0) return;
  const list = pending.map((t) => `• ${t.title}`).join("\n");
  addEmail({
    subject: `Pending tasks summary (${pending.length})`,
    body: `You have ${pending.length} pending task${pending.length === 1 ? "" : "s"}:\n\n${list}`,
    kind: "recurring",
  });
}

function sendFibonacciSms(state: SchedulerState) {
  const pending = pendingTasks();
  if (pending.length > 0) {
    const list = pending.map((t) => `• ${t.title}`).join("\n");
    addSms(
      `Pending tasks (${pending.length}):\n\n${list}`
    );
  }
  scheduleNextSms(state);
}

// In test mode TEST_SMS_INTERVAL_MS overrides the Fibonacci delay and fibIndex
// is not advanced, giving a predictable fixed cadence for automated tests.
const TEST_SMS_MS = process.env.TEST_SMS_INTERVAL_MS
  ? parseInt(process.env.TEST_SMS_INTERVAL_MS, 10)
  : null;

function scheduleNextSms(state: SchedulerState) {
  const delayMs = TEST_SMS_MS ?? fib(state.smsFibIndex) * 60_000;
  if (!TEST_SMS_MS) state.smsFibIndex++;
  state.smsTimeoutId = setTimeout(() => sendFibonacciSms(state), delayMs);
}

export function triggerImmediateEmail(task: Task) {
  const token = signTaskToken(task.id);
  const completionUrl = `${BASE_URL}/api/tasks/${task.id}/complete?token=${token}`;
  addEmail({
    subject: `New task added: ${task.title}`,
    body: `A new task has been added:\n\n• ${task.title}`,
    kind: "immediate",
    taskId: task.id,
    completionUrl,
  });
}

export function startScheduler() {
  if (globalThis.__scheduler__) return;
  const state: SchedulerState = {
    emailIntervalId: setInterval(sendRecurringSummaryEmail, 60_000),
    smsTimeoutId: null,
    smsFibIndex: 0,
  };
  globalThis.__scheduler__ = state;
  scheduleNextSms(state);
}
