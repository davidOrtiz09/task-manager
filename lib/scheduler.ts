import "server-only";
import { addEmail, addSms, listTasks } from "./store";
import type { Task } from "./schemas";

interface SchedulerState {
  emailIntervalId: ReturnType<typeof setInterval>;
  smsTimeoutId: ReturnType<typeof setTimeout> | null;
  smsFibIndex: number;
}

declare global {
  // eslint-disable-next-line no-var
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

function scheduleNextSms(state: SchedulerState) {
  const delayMs = fib(state.smsFibIndex) * 60_000;
  state.smsFibIndex++;
  state.smsTimeoutId = setTimeout(() => sendFibonacciSms(state), delayMs);
}

export function triggerImmediateEmail(task: Task) {
  addEmail({
    subject: `New task added: ${task.title}`,
    body: `A new task has been added:\n\n• ${task.title}\n\nUse the Task Manager to complete it.`,
    kind: "immediate",
    taskId: task.id,
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
