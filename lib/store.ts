import "server-only";
import { randomUUID } from "crypto";
import type { Task, Email, Sms } from "./schemas";

interface Store {
  tasks: Map<string, Task>;
  emails: Email[];
  sms: Sms[];
}

declare global {
  var __store__: Store | undefined;
}

const store: Store =
  globalThis.__store__ ??
  (globalThis.__store__ = { tasks: new Map(), emails: [], sms: [] });

export function addTask(title: string): Task {
  const task: Task = {
    id: randomUUID(),
    title,
    createdAt: new Date().toISOString(),
    completedAt: null,
  };
  store.tasks.set(task.id, task);
  return task;
}

export function completeTask(id: string): Task | null {
  const task = store.tasks.get(id);
  if (!task || task.completedAt) return null;
  const updated: Task = { ...task, completedAt: new Date().toISOString() };
  store.tasks.set(id, updated);
  return updated;
}

export function getTask(id: string): Task | undefined {
  return store.tasks.get(id);
}

export function listTasks(): Task[] {
  return Array.from(store.tasks.values());
}

export function addEmail(data: Omit<Email, "id" | "createdAt">): Email {
  const email: Email = { ...data, id: randomUUID(), createdAt: new Date().toISOString() };
  store.emails.unshift(email);
  return email;
}

export function listEmails(): Email[] {
  return [...store.emails];
}

export function addSms(body: string): Sms {
  const sms: Sms = { id: randomUUID(), body, createdAt: new Date().toISOString() };
  store.sms.unshift(sms);
  return sms;
}

export function listSms(): Sms[] {
  return [...store.sms];
}
