import { describe, expect, it } from "vitest";
import { parseEnv } from "./env.js";

const DATABASE_URL = "postgresql://user:pass@localhost:5432/db";

describe("parseEnv", () => {
  it("applies the defaults", () => {
    expect(parseEnv({ DATABASE_URL })).toEqual({
      NODE_ENV: "development",
      API_PORT: 3001,
      DATABASE_URL,
    });
  });

  it("converts API_PORT from text to a number", () => {
    expect(parseEnv({ DATABASE_URL, API_PORT: "4000" }).API_PORT).toBe(4000);
  });

  it("rejects a database URL that is not PostgreSQL", () => {
    expect(() => parseEnv({ DATABASE_URL: "mysql://x" })).toThrow(/must start with postgresql/);
  });

  it("lists every problem at once", () => {
    const run = () => parseEnv({ API_PORT: "not-a-number" });
    expect(run).toThrow(/DATABASE_URL/);
    expect(run).toThrow(/API_PORT/);
  });

  it("returns a frozen object, so settings can't be changed by accident", () => {
    expect(Object.isFrozen(parseEnv({ DATABASE_URL }))).toBe(true);
  });
});
