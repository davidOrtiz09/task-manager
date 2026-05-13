import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

const SECRET = process.env.TOKEN_SECRET ?? "dev-secret-change-in-production";

export function signTaskToken(taskId: string): string {
  return createHmac("sha256", SECRET).update(taskId).digest("hex");
}

export function verifyTaskToken(taskId: string, token: string): boolean {
  const expected = signTaskToken(taskId);
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(token));
  } catch {
    return false;
  }
}
