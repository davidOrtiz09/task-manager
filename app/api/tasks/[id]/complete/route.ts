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
    return NextResponse.json({ error: "Invalid or expired link" }, { status: 403 });
  }

  const task = completeTask(id);
  if (!task) {
    return NextResponse.json({ error: "Task not found or already completed" }, { status: 404 });
  }

  return NextResponse.json(task);
}
