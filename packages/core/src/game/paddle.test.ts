import { describe, expect, it } from "vitest";
import { FIELD, PADDLE } from "./constants.js";
import { movePaddle, paddleX } from "./paddle.js";

const HALF = PADDLE.height / 2;

describe("movePaddle", () => {
  it("moves at PADDLE.speed in the pressed direction", () => {
    expect(movePaddle(250, 1, 0.1)).toBeCloseTo(250 + PADDLE.speed * 0.1);
    expect(movePaddle(250, -1, 0.1)).toBeCloseTo(250 - PADDLE.speed * 0.1);
  });

  it("doesn't move without input", () => {
    expect(movePaddle(250, 0, 0.1)).toBe(250);
  });

  it("stops at the top and bottom walls", () => {
    expect(movePaddle(HALF + 1, -1, 1)).toBe(HALF);
    expect(movePaddle(FIELD.height - HALF - 1, 1, 1)).toBe(FIELD.height - HALF);
  });
});

describe("paddleX", () => {
  it("places both paddles at the same distance from their walls", () => {
    expect(paddleX("left")).toBe(PADDLE.offset + PADDLE.width / 2);
    expect(paddleX("left") + paddleX("right")).toBe(FIELD.width);
  });
});