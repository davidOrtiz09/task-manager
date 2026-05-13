"use client";

import { useState, useEffect, useCallback } from "react";
import { z } from "zod";
import { EmailSchema } from "@/lib/schemas";
import type { Email } from "@/lib/schemas";

function formatTimestamp(isoString: string): string {
  return new Date(isoString).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function EmailsPanel() {
  const [emails, setEmails] = useState<Email[]>([]);

  const fetchEmails = useCallback(async () => {
    const res = await fetch("/api/emails");
    const raw = await res.json();
    const parsed = z.array(EmailSchema).safeParse(raw);
    if (parsed.success) setEmails(parsed.data);
  }, []);

  useEffect(() => {
    fetchEmails();
    const pollId = setInterval(fetchEmails, 2000);
    return () => clearInterval(pollId);
  }, [fetchEmails]);

  return (
    <div className="p-6 flex flex-col gap-6">
      <h2 className="text-lg font-semibold">Emails</h2>

      {emails.length === 0 ? (
        <p className="text-sm text-gray-400">No emails yet. Add a task to trigger one.</p>
      ) : (
        <ul data-testid="email-list" className="space-y-3">
          {emails.map((email) => (
            <li
              key={email.id}
              data-testid="email-item"
              className="border border-gray-200 rounded-md px-4 py-3 flex flex-col gap-1"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold leading-snug flex-1">{email.subject}</p>
                <span
                  className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                    email.kind === "immediate"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {email.kind}
                </span>
              </div>
              <p className="text-xs text-gray-500 whitespace-pre-wrap">{email.body}</p>
              {email.completionUrl && (
                <a
                  data-testid="complete-email-link"
                  href={email.completionUrl}
                  className="self-start mt-1 text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
                >
                  Complete Task →
                </a>
              )}
              <p className="text-xs text-gray-400">{formatTimestamp(email.createdAt)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
