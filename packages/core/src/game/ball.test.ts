import { describe, expect, it } from "vitest";
import { bounceOffWalls, moveBall } from "./ball.js";
import { BALL, FIELD } from "./constants.js";

const HALF = BALL.size / 2;

describe("moveBall", () => {
  it("moves by velocity * time", () => {
    const ball = moveBall({ x: 100, y: 100, vx: 200, vy: -100 }, 0.5);
    expect(ball).toEqual({ x: 200, y: 50, vx: 200, vy: -100 });
  });
});

describe("bounceOffWalls", () => {
  it("sends a ball that touched the top wall back down, inside the field", () => {
    const ball = bounceOffWalls({ x: 400, y: 2, vx: 300, vy: -150 });
    expect(ball).toEqual({ x: 400, y: HALF, vx: 300, vy: 150 });
  });

  it("sends a ball that touched the bottom wall back up, inside the field", () => {
    const ball = bounceOffWalls({ x: 400, y: FIELD.height - 1, vx: -300, vy: 150 });
    expect(ball).toEqual({ x: 400, y: FIELD.height - HALF, vx: -300, vy: -150 });
  });

  it("keeps a ball that is already moving away from the wall moving away", () => {
    expect(bounceOffWalls({ x: 400, y: 3, vx: 0, vy: 150 }).vy).toBe(150);
  });

  it("leaves a ball in the open field untouched", () => {
    const ball = { x: 400, y: 250, vx: 300, vy: 150 };
    expect(bounceOffWalls(ball)).toBe(ball);
  });
});