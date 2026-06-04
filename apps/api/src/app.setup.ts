import type { INestApplication } from "@nestjs/common";

export function configureApp(app: INestApplication): void {
  // Every route starts with /api  →  /api/health, /api/auth/login, ...
  // The reverse proxy (nginx) sends /api/* to this server, the rest to Next.js.
  app.setGlobalPrefix("api");
}
