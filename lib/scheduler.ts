import "server-only";
import { addEmail, listTasks } from "./store";
import type { Task } from "./schemas";

interface SchedulerState {
  emailIntervalId: ReturnType<typeof setInterval>;
}

declare global {
  // eslint-disable-next-line no-var
  var __scheduler__: SchedulerState | undefined;
}

function sendRecurringSummaryEmail() {
  const pending = listTasks().filter((t) => !t.completedAt);
  if (pending.length === 0) return;
  const list = pending.map((t) => `• ${t.title}`).join("\n");
  addEmail({
    subject: `Pending tasks summary (${pending.length})`,
    body: `You have ${pending.length} pending task${pending.length === 1 ? "" : "s"}:\n\n${list}`,
    kind: "recurring",
  });
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
  globalThis.__scheduler__ = {
    emailIntervalId: setInterval(sendRecurringSummaryEmail, 60_000),
  };
}
