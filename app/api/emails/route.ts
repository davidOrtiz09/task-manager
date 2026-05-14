import { NextResponse } from "next/server";
import { listEmails, getTask } from "@/lib/store";

export async function GET() {
  const emails = listEmails().map((email) => {
    if (email.taskId && email.completionUrl) {
      const task = getTask(email.taskId);
      if (task?.completedAt) {
        const { completionUrl: _, ...rest } = email;
        return rest;
      }
    }
    return email;
  });
  return NextResponse.json(emails);
}
