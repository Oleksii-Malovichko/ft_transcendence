import { describe, expect, it } from "vitest";
import { buildBracket, championOf, drawSeats, nextMatch, reportWinner } from "./bracket.js";

const FOUR = ["ada", "bob", "cleo", "dan"];
const EIGHT = [...FOUR, "eve", "finn", "gus", "hana"];

/** Plays the whole tournament, the first player of each match always winning. */
function playThrough(aliases: string[]) {
  let bracket = buildBracket(aliases);
  for (let match = nextMatch(bracket); match; match = nextMatch(bracket)) {
    bracket = reportWinner(bracket, match.round, match.slot, match.players[0]!);
  }
  return bracket;
}

describe("buildBracket", () => {
  it("pairs neighbouring seats in the first round", () => {
    const bracket = buildBracket(FOUR);
    expect(bracket[0]?.players).toEqual(["ada", "bob"]);
    expect(bracket[1]?.players).toEqual(["cleo", "dan"]);
  });

  it("has one match fewer than there are players", () => {
    expect(buildBracket(FOUR)).toHaveLength(3);
    expect(buildBracket(EIGHT)).toHaveLength(7);
  });

  it("leaves the later rounds empty until they are reached", () => {
    expect(buildBracket(EIGHT).at(-1)?.players).toEqual([null, null]);
  });
});

describe("reportWinner", () => {
  it("moves the winner into the next round, in the right place", () => {
    let bracket = buildBracket(FOUR);
    bracket = reportWinner(bracket, 0, 0, "ada");
    bracket = reportWinner(bracket, 0, 1, "dan");
    expect(bracket.at(-1)?.players).toEqual(["ada", "dan"]);
  });

  it("changes nothing else", () => {
    const bracket = buildBracket(FOUR);
    expect(reportWinner(bracket, 0, 0, "ada")[1]).toEqual(bracket[1]);
  });
});

describe("nextMatch", () => {
  it("is the first match that can be played", () => {
    const bracket = buildBracket(EIGHT);
    expect(nextMatch(bracket)?.players).toEqual(["ada", "bob"]);
  });

  it("is nothing once the final is over", () => {
    expect(nextMatch(playThrough(FOUR))).toBeNull();
  });
});

describe("championOf", () => {
  it("is nobody until the final is played", () => {
    expect(championOf(buildBracket(FOUR))).toBeNull();
  });

  it("is the winner of the last match", () => {
    expect(championOf(playThrough(EIGHT))).toBe("ada");
  });
});

describe("drawSeats", () => {
  it("gives every seat exactly once", () => {
    const seats = drawSeats(8, seededRandom(3));
    expect([...seats].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });

  it("does not simply keep the order people registered in", () => {
    expect(drawSeats(8, seededRandom(7))).not.toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });
});

/** A repeatable generator, so the draw test never flakes. */
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
