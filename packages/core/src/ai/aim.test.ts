// Unit tests for the aim error: bounded, reachable, and mostly small.
import { describe, expect, it } from "vitest";
import { FIELD, PADDLE } from "../game/constants.js";
import { withAimError } from "./aim.js";

/** A repeatable pseudo-random generator (mulberry32), so this test never flakes. */
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("withAimError", () => {
  it("doesn't miss at all when aimError is 0", () => {
    expect(withAimError(200, 0)).toBe(200);
  });

  it("misses by at most aimError, in both directions", () => {
    expect(withAimError(250, 30, () => 0)).toBeCloseTo(220);
    expect(withAimError(250, 30, () => 0.5)).toBeCloseTo(250);
    expect(withAimError(250, 30, () => 1 - 1e-9)).toBeCloseTo(280);
  });

  it("never aims where the paddle can't go", () => {
    expect(withAimError(0, 30, () => 0)).toBe(PADDLE.height / 2);
    expect(withAimError(FIELD.height, 30, () => 1 - 1e-9)).toBe(FIELD.height - PADDLE.height / 2);
  });

  it("makes small mistakes often and big ones rarely", () => {
    const random = seededRandom(42);
    const errors = Array.from({ length: 10_000 }, () => withAimError(250, 40, random) - 250);
    const small = errors.filter((error) => Math.abs(error) <= 20).length / errors.length;
    const mean = errors.reduce((sum, error) => sum + error, 0) / errors.length;
    // Triangular distribution: 75% of the mistakes are within half the range.
    expect(small).toBeGreaterThan(0.72);
    expect(small).toBeLessThan(0.78);
    expect(Math.abs(mean)).toBeLessThan(1);
  });
});
