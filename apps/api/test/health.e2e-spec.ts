import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterAll, beforeAll, describe, it } from "vitest";
import { AppModule } from "../src/app.module.js";
import { configureApp } from "../src/app.setup.js";
import { ENV } from "../src/config/env.module.js";
import { PrismaService } from "../src/prisma/prisma.service.js";

// The same settings the app would get from .env, without needing one.
const TEST_ENV = {
  NODE_ENV: "test",
  API_PORT: 3001,
  DATABASE_URL: "postgresql://unused",
  JWT_SECRET: "x".repeat(32),
  UPLOADS_DIR: "./uploads",
} as const;

describe("GET /api/health (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      // No .env and no database needed: the settings and the database client
      // are replaced with stand-ins (the health check uses neither).
      .overrideProvider(ENV)
      .useValue(TEST_ENV)
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();
    app = moduleRef.createNestApplication();
    configureApp(app, TEST_ENV); // same setup as main.ts
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("answers 200 with { status: 'ok' }", () => {
    return request(app.getHttpServer()).get("/api/health").expect(200, { status: "ok" });
  });
});
