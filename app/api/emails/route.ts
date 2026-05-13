import { NextResponse } from "next/server";
import { listEmails } from "@/lib/store";

export async function GET() {
  return NextResponse.json(listEmails());
}
