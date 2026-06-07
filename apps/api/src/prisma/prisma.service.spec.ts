import { afterEach, describe, expect, it } from "vitest";
import { PrismaService } from "./prisma.service.js";

describe("PrismaService", () => {
  const original = process.env.DATABASE_URL;

  afterEach(() => {
    // Assigning `undefined` to process.env stores the STRING "undefined",
    // so restore by deleting when there was no value before.
    if (original === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = original;
  });

  it("refuses to start without DATABASE_URL, with a clear message", () => {
    delete process.env.DATABASE_URL;
    expect(() => new PrismaService()).toThrow(/DATABASE_URL is not set/);
  });

  it("builds a client when DATABASE_URL is set (no connection yet)", () => {
    process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/test";
    const prisma = new PrismaService();
    // Check the API instead of printing the object: a Prisma client is a
    // deep Proxy, and asking the test runner to display it never ends.
    expect(typeof prisma.$connect).toBe("function");
    expect(typeof prisma.user.findUnique).toBe("function");
  });

  it("stops startup with a clear message when the database is unreachable", async () => {
    // Port 1 on this machine refuses connections at once: nothing to install.
    process.env.DATABASE_URL = "postgresql://user:pass@127.0.0.1:1/test";
    const prisma = new PrismaService();
    await expect(prisma.onModuleInit()).rejects.toThrow(/Cannot reach the database/);
    await prisma.$disconnect();
  });
});
