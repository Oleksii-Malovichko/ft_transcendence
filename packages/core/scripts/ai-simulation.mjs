/* eslint-disable */

import {
  AI_PRESETS,
  AiPlayer,
  createInitialState,
  DIFFICULTIES,
  FIELD,
  step,
  TICK_RATE,
} from "../dist/index.js";

const DT = 1 / TICK_RATE;
const CENTER = FIELD.height / 2;
const GAMES = Number(process.argv[2] ?? 100);
const MAX_MINUTES = 15;

/** Repeatable pseudo-random numbers (mulberry32). */
function seededRandom(seed) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * The reference player: sees the ball with a 0.2 s delay, re-aims five times
 * per second, misses by up to 25 units, and stops within 10 units of its aim.
 */
function casualPlayer(side, random) {
  const delayTicks = Math.round(0.2 * TICK_RATE);
  const seen = [];
  let target = CENTER;
  let sinceAim = 0;
  return (state) => {
    seen.push(state.ball.y);
    const ballY = seen.length > delayTicks ? seen[seen.length - 1 - delayTicks] : CENTER;
    if (++sinceAim >= TICK_RATE / 5) {
      sinceAim = 0;
      target = ballY + (random() * 2 - 1) * 25;
    }
    const distance = target - state.paddles[side];
    return Math.abs(distance) <= 10 ? 0 : distance < 0 ? -1 : 1;
  };
}

/** An average player: watches often, but reacts slowly and aims roughly. */
const AVERAGE = { visionInterval: 0.15, reactionDelay: 0.32, aimError: 55, deadZone: 10 };

/** A good player: sees the game continuously and predicts, unlike our AI. */
const SKILLED = { visionInterval: 0.1, reactionDelay: 0.15, aimError: 15, deadZone: 6 };

const REFERENCES = {
  casual: (side, seed) => casualPlayer(side, seededRandom(seed)),
  average: (side, seed) => {
    const player = new AiPlayer(side, AVERAGE, seededRandom(seed));
    return (state) => player.update(state, DT);
  },
  skilled: (side, seed) => {
    const player = new AiPlayer(side, SKILLED, seededRandom(seed));
    return (state) => player.update(state, DT);
  },
};

function playGame(config, reference, seed) {
  const ai = new AiPlayer("right", config, seededRandom(seed));
  const human = REFERENCES[reference]("left", seed + 7919);
  let state = createInitialState();
  for (let tick = 0; tick < MAX_MINUTES * 60 * TICK_RATE && state.winner === null; tick++) {
    state = step(state, { left: human(state), right: ai.update(state, DT) }, DT);
  }
  return state;
}

function measure(difficulty, reference) {
  let wins = 0;
  let aiPoints = 0;
  let humanPoints = 0;
  for (let game = 0; game < GAMES; game++) {
    const state = playGame(AI_PRESETS[difficulty], reference, 1000 + game);
    if (state.winner === "right") wins++;
    aiPoints += state.score.right;
    humanPoints += state.score.left;
  }
  const rate = ((100 * wins) / GAMES).toFixed(0).padStart(3);
  return `${rate}% (points ${aiPoints}–${humanPoints})`.padEnd(26);
}

console.log(`${GAMES} games per level and opponent — how often the AI wins\n`);
for (const difficulty of DIFFICULTIES) {
  console.log();
}
