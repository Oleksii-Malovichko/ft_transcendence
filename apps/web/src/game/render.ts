import {
  BALL,
  FIELD,
  type GameState,
  PADDLE,
  paddleHeightFor,
  paddleX,
  POWER_UPS,
  type Theme,
  THEMES,
} from "@ft/core";

export function drawGame(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  theme: Theme = THEMES.classic,
): void {
  ctx.fillStyle = theme.field;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  drawCenterLine(ctx, theme);
  drawPowerUps(ctx, theme, state);
  // paddleHeightFor, not the raw setting: a collected bonus makes one paddle
  // taller, and the picture must show the paddle the ball will really hit.
  drawPaddle(ctx, theme, paddleX("left"), state.paddles.left, paddleHeightFor(state, "left"));
  drawPaddle(ctx, theme, paddleX("right"), state.paddles.right, paddleHeightFor(state, "right"));
  drawBall(ctx, theme, state);
}

function drawCenterLine(ctx: CanvasRenderingContext2D, theme: Theme): void {
  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 4;
  ctx.setLineDash([12, 12]);
  ctx.beginPath();
  ctx.moveTo(FIELD.width / 2, 0);
  ctx.lineTo(FIELD.width / 2, FIELD.height);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawPaddle(
  ctx: CanvasRenderingContext2D,
  theme: Theme,
  centerX: number,
  centerY: number,
  height: number,
): void {
  ctx.fillStyle = theme.paddle;
  ctx.fillRect(centerX - PADDLE.width / 2, centerY - height / 2, PADDLE.width, height);
}

function drawBall(ctx: CanvasRenderingContext2D, theme: Theme, state: GameState): void {
  ctx.fillStyle = theme.ball;
  ctx.fillRect(state.ball.x - BALL.size / 2, state.ball.y - BALL.size / 2, BALL.size, BALL.size);
}

/** The bonuses waiting on the field: paddle-coloured or ball-coloured, by kind. */
function drawPowerUps(ctx: CanvasRenderingContext2D, theme: Theme, state: GameState): void {
  const half = POWER_UPS.size / 2;
  for (const powerUp of state.powerUps) {
    ctx.fillStyle = powerUp.kind === "bigPaddle" ? theme.paddle : theme.ball;
    ctx.globalAlpha = 0.8;
    ctx.fillRect(powerUp.x - half, powerUp.y - half, POWER_UPS.size, POWER_UPS.size);
    ctx.globalAlpha = 1;
  }
}
