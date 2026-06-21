import { describe, expect, it } from "vitest";
import { PasswordService } from "./password.service.js";

const passwords = new PasswordService();
const PASSWORD = "correct horse battery staple";

describe("PasswordService", () => {
  it("produces an Argon2id hash with the OWASP parameters", async () => {
    expect(await passwords.hash(PASSWORD)).toMatch(/^\$argon2id\$v=19\$m=19456,t=2,p=1\$/);
  });

  it("salts every hash: the same password never gives the same hash twice", async () => {
    expect(await passwords.hash(PASSWORD)).not.toBe(await passwords.hash(PASSWORD));
  });

  it("accepts the right password and rejects a wrong one", async () => {
    const hash = await passwords.hash(PASSWORD);
    expect(await passwords.verify(hash, PASSWORD)).toBe(true);
    expect(await passwords.verify(hash, "correct horse battery stapler")).toBe(false);
  });

  it("treats both Unicode spellings of the same text as one password", async () => {
    const composed = "caf\u00e9 au lait, no sugar"; //    é as ONE code point
    const decomposed = "cafe\u0301 au lait, no sugar"; // e + combining accent
    const hash = await passwords.hash(composed);
    expect(await passwords.verify(hash, decomposed)).toBe(true);
  });

  it("returns false instead of throwing on a malformed hash", async () => {
    expect(await passwords.verify("not-a-hash", PASSWORD)).toBe(false);
  });
});