import { NextResponse } from "next/server";
import { CreateTaskInputSchema } from "@/lib/schemas";
import { addTask, listTasks } from "@/lib/store";
import { triggerImmediateEmail } from "@/lib/scheduler";

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
  triggerImmediateEmail(task);
  return NextResponse.json(task, { status: 201 });
}
