import { NextResponse } from "next/server";
import { completeTask } from "@/lib/store";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
