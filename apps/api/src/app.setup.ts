import type { INestApplication } from "@nestjs/common";
import helmet from "helmet";
import { HttpExceptionFilter } from "./common/http-exception.filter.js";
import type { Env } from "./config/env.js";

const DEV_WEB_ORIGIN = "http://localhost:3000";

export function configureApp(app: INestApplication, env: Env): void {
  app.setGlobalPrefix("api");

  app.useGlobalFilters(new HttpExceptionFilter());

  app.use(helmet({ contentSecurityPolicy: false }));

  if (env.NODE_ENV !== "production") {
    app.enableCors({ origin: DEV_WEB_ORIGIN, credentials: true });
  }
}
