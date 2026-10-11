import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import { configureApp } from "./app.setup.js";
import type { Env } from "./config/env.js";
import { ENV } from "./config/env.module.js";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { abortOnError: false });

  const env = app.get<Env>(ENV);
  configureApp(app, env);

  app.enableShutdownHooks();

  await app.listen(env.API_PORT);
}

await bootstrap();
