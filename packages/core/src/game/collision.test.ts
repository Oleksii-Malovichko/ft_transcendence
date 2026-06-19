import { describe, expect, it } from "vitest";
import { collideWithPaddles, hitOffset } from "./collision.js";
import { BALL, PADDLE } from "./constants.js";
import { paddleX } from "./paddle.js";
import type { Ball } from "./state.js";

const PADDLES = { left: 250, right: 250 };
const speedOf = (ball: Ball) => Math.hypot(ball.vx, ball.vy);

function atLeftPaddle(y: number, speed = 400): Ball {
  return { x: paddleX("left") + 10, y, vx: -speed, vy: 0 };
}

describe("collideWithPaddles", () => {
  it("sends a ball hitting the middle straight back, a bit faster", () => {
    const ball = collideWithPaddles(atLeftPaddle(250), PADDLES);
    expect(ball.vx).toBeGreaterThan(0);
    expect(ball.vy).toBeCloseTo(0);
    expect(speedOf(ball)).toBeCloseTo(400 * BALL.speedUp);
  });

  it("sends a ball hitting the very edge away at the steepest angle", () => {
    const edge = 250 + PADDLE.height / 2 + BALL.size / 2;
    const ball = collideWithPaddles(atLeftPaddle(edge), PADDLES);
    expect(Math.atan2(ball.vy, ball.vx)).toBeCloseTo(BALL.maxBounceAngle);
  });

  it("aims upwards when the upper half is hit", () => {
    expect(collideWithPaddles(atLeftPaddle(230), PADDLES).vy).toBeLessThan(0);
  });

  it("never makes the ball faster than BALL.maxSpeed", () => {
    const ball = collideWithPaddles(atLeftPaddle(250, BALL.maxSpeed), PADDLES);
    expect(speedOf(ball)).toBeCloseTo(BALL.maxSpeed);
  });

  it("lets the ball pass when the paddle is somewhere else", () => {
    const ball = atLeftPaddle(100);
    expect(collideWithPaddles(ball, PADDLES)).toBe(ball);
  });

  it("counts a hit only once: the ball leaves from in front of the paddle", () => {
    const once = collideWithPaddles(atLeftPaddle(250), PADDLES);
    expect(collideWithPaddles(once, PADDLES)).toBe(once);
  });

  it("works the same way on the right paddle", () => {
    const ball = collideWithPaddles({ x: paddleX("right") - 10, y: 250, vx: 400, vy: 0 }, PADDLES);
    expect(ball.vx).toBeLessThan(0);
  });
});

describe("hitOffset", () => {
  it("is 0 in the middle and clamped to -1…1 beyond the edges", () => {
    const ball = (y: number): Ball => ({ x: 0, y, vx: 0, vy: 0 });
    expect(hitOffset(ball(250), 250)).toBe(0);
    expect(hitOffset(ball(1000), 250)).toBe(1);
    expect(hitOffset(ball(-1000), 250)).toBe(-1);
  });
});