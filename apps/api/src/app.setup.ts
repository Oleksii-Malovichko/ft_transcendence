import type { INestApplication } from "@nestjs/common";
import { HttpExceptionFilter } from "./common/http-exception.filter.js";

export function configureApp(app: INestApplication): void {
  // Every route starts with /api  →  /api/health, /api/auth/login, ...
  // The reverse proxy (nginx) sends /api/* to this server, the rest to Next.js.
  app.setGlobalPrefix("api");
  app.useGlobalFilters(new HttpExceptionFilter());
}
