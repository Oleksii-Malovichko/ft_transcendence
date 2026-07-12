import { BALL, FIELD, type GameState, PADDLE, paddleX } from "@ft/core";

const COLORS = {
  field: "#0f172a", // slate-900
  line: "#334155", // slate-700
  paddle: "#e2e8f0", // slate-200
  ball: "#fbbf24", // amber-400
} as const;

export function drawGame(ctx: CanvasRenderingContext2D, state: GameState): void {
  ctx.fillStyle = COLORS.field;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  drawCenterLine(ctx);
  drawPaddle(ctx, paddleX("left"), state.paddles.left);
  drawPaddle(ctx, paddleX("right"), state.paddles.right);
  drawBall(ctx, state);
}

function drawCenterLine(ctx: CanvasRenderingContext2D): void {
  ctx.strokeStyle = COLORS.line;
  ctx.lineWidth = 4;
  ctx.setLineDash([12, 12]);
  ctx.beginPath();
  ctx.moveTo(FIELD.width / 2, 0);
  ctx.lineTo(FIELD.width / 2, FIELD.height);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawPaddle(ctx: CanvasRenderingContext2D, centerX: number, centerY: number): void {
  ctx.fillStyle = COLORS.paddle;
  ctx.fillRect(
    centerX - PADDLE.width / 2,
    centerY - PADDLE.height / 2,
    PADDLE.width,
    PADDLE.height,
  );
}

function drawBall(ctx: CanvasRenderingContext2D, state: GameState): void {
  ctx.fillStyle = COLORS.ball;
  ctx.fillRect(state.ball.x - BALL.size / 2, state.ball.y - BALL.size / 2, BALL.size, BALL.size);
}