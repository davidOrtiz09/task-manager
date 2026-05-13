"use client";

import { useState, useEffect, useCallback } from "react";
import { z } from "zod";
import { SmsSchema } from "@/lib/schemas";
import type { Sms } from "@/lib/schemas";

function formatTimestamp(isoString: string): string {
  return new Date(isoString).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function SmsPanel() {
  const [messages, setMessages] = useState<Sms[]>([]);

  const fetchSms = useCallback(async () => {
    const res = await fetch("/api/sms");
    const raw = await res.json();
    const parsed = z.array(SmsSchema).safeParse(raw);
    if (parsed.success) setMessages(parsed.data);
  }, []);

  useEffect(() => {
    fetchSms();
    const pollId = setInterval(fetchSms, 2000);
    return () => clearInterval(pollId);
  }, [fetchSms]);

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-baseline gap-2">
        <h2 className="text-lg font-semibold">SMS</h2>
        <span className="text-xs text-gray-400">Fibonacci cadence</span>
      </div>

      {messages.length === 0 ? (
        <p className="text-sm text-gray-400">
          No messages yet. First SMS arrives after 1 minute.
        </p>
      ) : (
        <ul className="space-y-3">
          {messages.map((msg) => (
            <li
              key={msg.id}
              className="border border-gray-200 rounded-md px-4 py-3 flex flex-col gap-1"
            >
              <p className="text-xs text-gray-500 whitespace-pre-wrap">{msg.body}</p>
              <p className="text-xs text-gray-400">{formatTimestamp(msg.createdAt)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
