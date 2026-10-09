import { describe, expect, it } from "vitest";
import type { Env } from "../config/env.js";
import { PrismaService } from "./prisma.service.js";

// A valid settings object, like the one EnvModule provides.
function testEnv(databaseUrl: string): Env {
  return {
    NODE_ENV: "test",
    API_PORT: 3001,
    DATABASE_URL: databaseUrl,
    JWT_SECRET: "x".repeat(32),
  };
}

describe("PrismaService", () => {
  it("builds a client from the validated settings (no connection yet)", () => {
    const prisma = new PrismaService(testEnv("postgresql://user:pass@localhost:5432/test"));
    // Check the API instead of printing the object: a Prisma client is a
    // deep Proxy, and asking the test runner to display it never ends.
    expect(typeof prisma.$connect).toBe("function");
    expect(typeof prisma.user.findUnique).toBe("function");
  });

  it("stops startup with a clear message when the database is unreachable", async () => {
    // Port 1 on this machine refuses connections at once: nothing to install.
    const prisma = new PrismaService(testEnv("postgresql://user:pass@127.0.0.1:1/test"));
    await expect(prisma.onModuleInit()).rejects.toThrow(/Cannot reach the database/);
    await prisma.$disconnect();
  });
});
