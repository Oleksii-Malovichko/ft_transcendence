import { describe, expect, it } from "vitest";
import { parseEnv } from "./env.js";

const REQUIRED = {
  DATABASE_URL: "postgresql://user:pass@localhost:5432/db",
  JWT_SECRET: "x".repeat(32),
};

describe("parseEnv", () => {
  it("applies the defaults", () => {
    expect(parseEnv(REQUIRED)).toEqual({
      NODE_ENV: "development",
      API_PORT: 3001,
      UPLOADS_DIR: "./uploads",
      FORTY_TWO_API_URL: "https://api.intra.42.fr",
      WEB_ORIGIN: "http://localhost:3000",
      ...REQUIRED,
    });
  });

  it("converts API_PORT from text to a number", () => {
    expect(parseEnv({ ...REQUIRED, API_PORT: "4000" }).API_PORT).toBe(4000);
  });

  it("rejects a database URL that is not PostgreSQL", () => {
    expect(() => parseEnv({ ...REQUIRED, DATABASE_URL: "mysql://x" })).toThrow(
      /must start with postgresql/,
    );
  });

  it("rejects a JWT secret shorter than 32 characters", () => {
    expect(() => parseEnv({ ...REQUIRED, JWT_SECRET: "short" })).toThrow(/JWT_SECRET/);
  });

  it("lists every problem at once", () => {
    const run = () => parseEnv({ API_PORT: "not-a-number" });
    expect(run).toThrow(/DATABASE_URL/);
    expect(run).toThrow(/API_PORT/);
  });

  it("returns a frozen object, so settings can't be changed by accident", () => {
    expect(Object.isFrozen(parseEnv(REQUIRED))).toBe(true);
  });
});
