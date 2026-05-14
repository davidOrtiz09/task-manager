import { describe, it, expect } from "vitest";
import { fib } from "@/lib/scheduler";

describe("fib", () => {
  it("produces the Fibonacci minute cadence: 1, 1, 2, 3, 5, 8", () => {
    expect(fib(0)).toBe(1);
    expect(fib(1)).toBe(1);
    expect(fib(2)).toBe(2);
    expect(fib(3)).toBe(3);
    expect(fib(4)).toBe(5);
    expect(fib(5)).toBe(8);
  });
});
