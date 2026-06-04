import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterAll, beforeAll, describe, it } from "vitest";
import { AppModule } from "../src/app.module.js";
import { configureApp } from "../src/app.setup.js";

describe("GET /api/health (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app); // same setup as main.ts
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("answers 200 with { status: 'ok' }", () => {
    return request(app.getHttpServer()).get("/api/health").expect(200, { status: "ok" });
  });
});
