import { NextResponse } from "next/server";
import { CreateTaskInputSchema } from "@/lib/schemas";
import { addTask, listTasks } from "@/lib/store";

export async function GET() {
  return NextResponse.json(listTasks());
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = CreateTaskInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const task = addTask(parsed.data.title);
  // Phase 4: triggerImmediateEmail(task) will be added here
  return NextResponse.json(task, { status: 201 });
}
