"use client";

import { useState, useEffect, useCallback } from "react";
import { z } from "zod";
import { TaskSchema } from "@/lib/schemas";
import type { Task } from "@/lib/schemas";

function formatAge(isoString: string, now: number): string {
  const seconds = Math.max(0, Math.floor((now - new Date(isoString).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

function formatTimestamp(isoString: string): string {
  return new Date(isoString).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TasksPanel() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [input, setInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const fetchTasks = useCallback(async () => {
    const res = await fetch("/api/tasks");
    const raw = await res.json();
    const parsed = z.array(TaskSchema).safeParse(raw);
    if (parsed.success) setTasks(parsed.data);
  }, []);

  useEffect(() => {
    fetchTasks();
    const pollId = setInterval(fetchTasks, 2000);
    const tickId = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearInterval(pollId);
      clearInterval(tickId);
    };
  }, [fetchTasks]);

  const handleAdd = async () => {
    const title = input.trim();
    if (!title || submitting) return;
    setSubmitting(true);
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    setInput("");
    await fetchTasks();
    setSubmitting(false);
  };

  const handleComplete = async (id: string) => {
    await fetch(`/api/tasks/${id}/complete`, { method: "POST" });
    await fetchTasks();
  };

  const pending = tasks.filter((t) => !t.completedAt);
  const completed = tasks.filter((t) => t.completedAt);

  return (
    <div className="p-6 flex flex-col gap-6">
      <h2 className="text-lg font-semibold">Tasks</h2>

      <div className="flex gap-2">
        <input
          data-testid="task-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="New task…"
          className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          data-testid="add-task-btn"
          onClick={handleAdd}
          disabled={!input.trim() || submitting}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Adding…" : "Add Task"}
        </button>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Pending ({pending.length})
        </h3>
        <ul data-testid="pending-list" className="space-y-2">
          {pending.length === 0 ? (
            <li className="text-sm text-gray-400">No pending tasks.</li>
          ) : (
            pending.map((task) => (
              <li
                key={task.id}
                data-testid="pending-item"
                className="flex items-center justify-between gap-3 border border-gray-200 rounded-md px-3 py-2"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{task.title}</p>
                  <p className="text-xs text-gray-400">{formatAge(task.createdAt, now)}</p>
                </div>
                <button
                  data-testid="complete-btn"
                  onClick={() => handleComplete(task.id)}
                  className="shrink-0 text-xs border border-gray-300 rounded px-2 py-1 hover:bg-gray-50 transition-colors"
                >
                  Complete
                </button>
              </li>
            ))
          )}
        </ul>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Completed ({completed.length})
        </h3>
        <ul data-testid="completed-list" className="space-y-2">
          {completed.length === 0 ? (
            <li className="text-sm text-gray-400">No completed tasks.</li>
          ) : (
            completed.map((task) => (
              <li
                key={task.id}
                data-testid="completed-item"
                className="flex items-center justify-between gap-2 rounded-md px-3 py-2 bg-gray-50"
              >
                <p className="text-sm text-gray-500 truncate flex-1">{task.title}</p>
                <p className="text-xs text-gray-400 shrink-0">
                  {formatTimestamp(task.completedAt!)}
                </p>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
