
export const TICK_RATE = 60;


export const FIELD = { width: 800, height: 500 } as const;

export const PADDLE = {
  width: 12,
  height: 80,
  /** Gap between a paddle and the wall behind it. */
  offset: 24,
  /** Units per second while a key is held. */
  speed: 480,
} as const;

export const BALL = {
  /** Side length: the ball is a square, as in the original Pong. */
  size: 12,
  /** Speed of every serve, in units per second. */
  serveSpeed: 360,
  serveAngle: Math.PI / 12,
  /** Each paddle hit multiplies the speed by this… */
  speedUp: 1.05,
  maxSpeed: 900,
  /** Steepest rebound, from a hit on the very edge of a paddle: 60°. */
  maxBounceAngle: Math.PI / 3,
} as const;

export const RULES = {
  scoreLimit: 5,
  /** Pause before every serve, in seconds, so both players can get ready. */
  serveDelay: 1,
} as const;