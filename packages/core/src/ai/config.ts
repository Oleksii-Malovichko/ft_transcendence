export interface AiConfig {
  /** Seconds between two looks at the game (1 = once per second: it must predict). */
  readonly visionInterval: number;
  /** Seconds between seeing the game and acting on what it saw. */
  readonly reactionDelay: number;
  /** Largest aiming mistake, in field units (0 would be perfect aim). */
  readonly aimError: number;
  /**
   * The paddle stops when it is this close to its target. Keep it at least
   * half a tick of paddle movement (PADDLE.speed / TICK_RATE / 2 = 4 units),
   * or the paddle overshoots and shakes around the target.
   */
  readonly deadZone: number;
}
