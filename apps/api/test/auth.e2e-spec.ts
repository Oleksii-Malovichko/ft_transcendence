import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AppModule } from "../src/app.module.js";
import { configureApp } from "../src/app.setup.js";
import { ENV } from "../src/config/env.module.js";
import { Prisma, type User } from "../src/generated/prisma/client.js";
import { PrismaService } from "../src/prisma/prisma.service.js";
import { UsersService } from "../src/users/users.service.js";

const TEST_ENV = {
  NODE_ENV: "test",
  API_PORT: 3001,
  DATABASE_URL: "postgresql://unused",
  JWT_SECRET: "x".repeat(32),
  UPLOADS_DIR: "./uploads",
} as const;

const EMAIL = "ada@example.com";
const PASSWORD = "seven purple lanterns hum";

/** Just enough of the users table, in memory, including its unique email. */
class FakeUsers {
  private readonly users = new Map<string, User>();
  private nextId = 1;

  create(data: { email: string; passwordHash: string }): Promise<User> {
    if (this.users.has(data.email)) {
      return Promise.reject(
        new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
          code: "P2002",
          clientVersion: "test",
        }),
      );
    }
    const user = {
      id: this.nextId++,
      email: data.email,
      passwordHash: data.passwordHash,
      displayName: null,
      hasAvatar: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as User;
    this.users.set(user.email, user);
    return Promise.resolve(user);
  }

  findByEmail(email: string): Promise<User | null> {
    return Promise.resolve(this.users.get(email) ?? null);
  }

  findById(id: number): Promise<User | null> {
    return Promise.resolve([...this.users.values()].find((user) => user.id === id) ?? null);
  }
}

describe("auth routes (e2e)", () => {
  let app: INestApplication;
  let session = "";

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(ENV)
      .useValue(TEST_ENV)
      .overrideProvider(PrismaService)
      .useValue({})
      .overrideProvider(UsersService)
      .useValue(new FakeUsers())
      .compile();
    app = moduleRef.createNestApplication();
    configureApp(app, TEST_ENV);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("creates an account, normalizes the email and starts a session", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/auth/signup")
      .send({ email: "  Ada@Example.COM ", password: PASSWORD })
      .expect(201);
    expect(response.body.user).toEqual({
      id: 1,
      email: EMAIL,
      displayName: null,
      avatarUrl: "/api/users/1/avatar",
    });
    const cookie = response.headers["set-cookie"][0];
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/SameSite=Lax/);
    session = cookie.split(";")[0];
  });

  it("refuses a second account with the same email", () => {
    return request(app.getHttpServer())
      .post("/api/auth/signup")
      .send({ email: "ADA@example.com", password: PASSWORD })
      .expect(409);
  });

  it("refuses an invalid form with a message per field", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/auth/signup")
      .send({ email: "nope", password: "short" })
      .expect(400);
    expect(Object.keys(response.body.fields).sort()).toEqual(["email", "password"]);
  });

  it("says the same thing about a wrong password and an unknown email", async () => {
    const wrong = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email: EMAIL, password: "not my password at all" })
      .expect(401);
    const unknown = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email: "nobody@example.com", password: PASSWORD })
      .expect(401);
    expect(wrong.body.message).toBe(unknown.body.message);
  });

  it("logs in with the right password", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email: EMAIL, password: PASSWORD })
      .expect(200);
    expect(response.body.user.email).toBe(EMAIL);
  });

  it("answers 200 with user: null for a guest, and the user with the cookie", async () => {
    await request(app.getHttpServer()).get("/api/auth/me").expect(200, { user: null });
    const response = await request(app.getHttpServer())
      .get("/api/auth/me")
      .set("Cookie", session)
      .expect(200);
    expect(response.body.user.email).toBe(EMAIL);
  });

  it("forgets the session on logout", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/auth/logout")
      .set("Cookie", session)
      .expect(204);
    expect(response.headers["set-cookie"][0]).toMatch(/Expires=Thu, 01 Jan 1970/);
  });
});
