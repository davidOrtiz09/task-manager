import { NextResponse } from "next/server";
import { listSms } from "@/lib/store";

export async function GET() {
  return NextResponse.json(listSms());
}
