import { describe, it, expect } from "vitest";
import { signTaskToken, verifyTaskToken } from "@/lib/tokens";

describe("tokens", () => {
  it("verifies a correctly signed token", () => {
    const token = signTaskToken("task-abc");
    expect(verifyTaskToken("task-abc", token)).toBe(true);
  });

  it("rejects a tampered token", () => {
    expect(verifyTaskToken("task-abc", "not-a-valid-token")).toBe(false);
  });

  it("rejects a token issued for a different task id", () => {
    const token = signTaskToken("task-1");
    expect(verifyTaskToken("task-2", token)).toBe(false);
  });
});
