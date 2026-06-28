import { describe, expect, it } from "vitest";
import { bounceOffWalls, moveBall } from "../game/ball.js";
import { BALL, FIELD, TICK_RATE } from "../game/constants.js";
import type { Ball } from "../game/state.js";
import { predictBallY, reflectIntoField } from "./predict.js";

const TOP = BALL.size / 2;
const BOTTOM = FIELD.height - BALL.size / 2;
const SPAN = BOTTOM - TOP;

describe("predictBallY", () => {
  it("follows a straight line when no wall is in the way", () => {
    // 300 units to go at vx = 300: one second, so y moves by vy.
    expect(predictBallY({ x: 400, y: 250, vx: 300, vy: 50 }, 700)).toBeCloseTo(300);
  });

  it("stays level when the ball flies horizontally", () => {
    expect(predictBallY({ x: 100, y: 123, vx: 400, vy: 0 }, 700)).toBeCloseTo(123);
  });

  it("mirrors the path at one bounce off the bottom wall", () => {
    // Without the wall it would end 150 units below BOTTOM; it ends 150 above.
    const ball: Ball = { x: 0, y: BOTTOM - 50, vx: 200, vy: 200 };
    expect(predictBallY(ball, 200)).toBeCloseTo(BOTTOM - 150);
  });

  it("handles several bounces: top, bottom, top, then halfway down", () => {
    const ball: Ball = { x: 0, y: TOP + 10, vx: 100, vy: -2.5 * SPAN };
    expect(predictBallY(ball, 100)).toBeCloseTo(TOP + SPAN / 2 - 10);
  });

  it("agrees with the game engine's own physics", () => {
    const start: Ball = { x: 100, y: 200, vx: 350, vy: 420 };
    let ball = start;
    let bounces = 0;
    while (ball.x < 700) {
      const next = bounceOffWalls(moveBall(ball, 1 / TICK_RATE));
      if (Math.sign(next.vy) !== Math.sign(ball.vy)) bounces++;
      ball = next;
    }
    // The engine loses up to one tick of vertical movement per bounce.
    const allowed = bounces * (Math.abs(start.vy) / TICK_RATE);
    expect(bounces).toBeGreaterThan(0);
    expect(Math.abs((predictBallY(start, ball.x) ?? NaN) - ball.y)).toBeLessThanOrEqual(allowed);
  });

  it("returns null when the ball flies away or doesn't move sideways", () => {
    expect(predictBallY({ x: 400, y: 250, vx: -300, vy: 0 }, 700)).toBeNull();
    expect(predictBallY({ x: 400, y: 250, vx: 0, vy: 100 }, 700)).toBeNull();
  });
});

describe("reflectIntoField", () => {
  it("leaves positions inside the field unchanged", () => {
    expect(reflectIntoField(250)).toBeCloseTo(250);
  });

  it("mirrors positions beyond the top and bottom walls", () => {
    expect(reflectIntoField(TOP - 30)).toBeCloseTo(TOP + 30);
    expect(reflectIntoField(BOTTOM + 30)).toBeCloseTo(BOTTOM - 30);
  });
});
