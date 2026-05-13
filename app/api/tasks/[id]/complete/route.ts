import { NextResponse } from "next/server";
import { completeTask } from "@/lib/store";
import { verifyTaskToken } from "@/lib/tokens";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  const { id } = await params;
  const task = completeTask(id);
  if (!task) {
    return NextResponse.json(
      { error: "Task not found or already completed" },
      { status: 404 }
    );
  }
  return NextResponse.json(task);
}

export async function GET(req: Request, { params }: Params) {
  const { id } = await params;
  const token = new URL(req.url).searchParams.get("token") ?? "";

  if (!verifyTaskToken(id, token)) {
    return htmlResponse(403, "Invalid link", "This link is invalid or has already been used.");
  }

  const task = completeTask(id);
  if (!task) {
    return htmlResponse(404, "Already done", "This task was already completed.");
  }

  return htmlResponse(
    200,
    "Task completed",
    `<strong>${escapeHtml(task.title)}</strong> has been marked complete.`,
    true
  );
}

function escapeHtml(str: string) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function htmlResponse(status: number, heading: string, message: string, success = false) {
  const color = success ? "#16a34a" : "#dc2626";
  const icon = success ? "✓" : "✕";
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${heading}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:system-ui,sans-serif;background:#f9fafb;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:1rem}
    .card{background:#fff;border-radius:12px;padding:2.5rem 2rem;box-shadow:0 1px 4px rgba(0,0,0,.1);max-width:420px;width:100%;text-align:center}
    .icon{font-size:2.5rem;color:${color};margin-bottom:1rem}
    h1{font-size:1.25rem;color:#111827;margin-bottom:.5rem}
    p{font-size:.9rem;color:#6b7280;margin-bottom:1.5rem;line-height:1.5}
    a{display:inline-block;background:#2563eb;color:#fff;padding:.5rem 1.25rem;border-radius:6px;text-decoration:none;font-size:.875rem;font-weight:500}
    a:hover{background:#1d4ed8}
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${icon}</div>
    <h1>${heading}</h1>
    <p>${message}</p>
    <a href="/">Back to Task Manager</a>
  </div>
</body>
</html>`;
  return new Response(html, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
