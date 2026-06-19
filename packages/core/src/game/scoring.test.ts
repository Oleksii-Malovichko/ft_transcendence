import { describe, expect, it } from "vitest";
import { FIELD, RULES } from "./constants.js";
import { awardPoint, findWinner, scoringSide } from "./scoring.js";
import { createInitialState } from "./state.js";

describe("scoringSide", () => {
  const ballAt = (x: number) => ({ x, y: 250, vx: 0, vy: 0 });

  it("gives the point to the right player when the ball leaves on the left", () => {
    expect(scoringSide(ballAt(-1))).toBe("right");
  });

  it("gives the point to the left player when the ball leaves on the right", () => {
    expect(scoringSide(ballAt(FIELD.width + 1))).toBe("left");
  });

  it("gives no point while the ball is in the field", () => {
    expect(scoringSide(ballAt(FIELD.width / 2))).toBeNull();
  });
});

describe("awardPoint", () => {
  it("adds the point and serves towards the player who lost it", () => {
    const next = awardPoint(createInitialState(), "left");
    expect(next.score).toEqual({ left: 1, right: 0 });
    expect(next.ball.x).toBe(FIELD.width / 2);
    expect(next.ball.vx).toBeGreaterThan(0); // towards the right player
    expect(next.serveIn).toBe(RULES.serveDelay);
    expect(next.winner).toBeNull();
  });

  it("alternates the serve between up and down", () => {
    const first = awardPoint(createInitialState(), "left");
    const second = awardPoint(first, "left");
    expect(Math.sign(second.ball.vy)).toBe(-Math.sign(first.ball.vy));
  });

  it("declares the winner when the score limit is reached", () => {
    const almost = { ...createInitialState(), score: { left: RULES.scoreLimit - 1, right: 0 } };
    expect(awardPoint(almost, "left").winner).toBe("left");
  });
});

describe("findWinner", () => {
  it("returns null below the score limit", () => {
    expect(findWinner({ left: RULES.scoreLimit - 1, right: RULES.scoreLimit - 1 })).toBeNull();
  });

  it("returns the side that reached the score limit", () => {
    expect(findWinner({ left: 0, right: RULES.scoreLimit })).toBe("right");
  });
});