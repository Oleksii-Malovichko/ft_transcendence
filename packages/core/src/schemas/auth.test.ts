import { describe, expect, it } from "vitest";
import { z } from "zod";
import { LoginSchema, SignupSchema } from "./auth.js";

const PASSWORD = "correct horse battery staple";

function fieldErrors(schema: z.ZodType, input: unknown): Record<string, string[] | undefined> {
  const result = schema.safeParse(input);
  return result.success ? {} : z.flattenError(result.error).fieldErrors;
}

describe("SignupSchema", () => {
  it("accepts a valid signup and normalizes the email", () => {
    const input = SignupSchema.parse({ email: "  Bob@Example.COM ", password: PASSWORD });
    expect(input).toEqual({ email: "bob@example.com", password: PASSWORD });
  });

  it("rejects an invalid email with a message for the form", () => {
    const errors = fieldErrors(SignupSchema, { email: "bob@", password: PASSWORD });
    expect(errors.email).toEqual(["Enter a valid email address"]);
  });

  it("requires at least 15 characters, and nothing else", () => {
    expect(
      fieldErrors(SignupSchema, { email: "a@b.co", password: "a".repeat(14) }).password,
    ).toEqual(["Use at least 15 characters"]);
    expect(fieldErrors(SignupSchema, { email: "a@b.co", password: "a".repeat(15) })).toEqual({});
  });

  it("counts characters, not JavaScript string units", () => {
    expect(
      fieldErrors(SignupSchema, { email: "a@b.co", password: "😀".repeat(14) }).password,
    ).toBeDefined();
    expect(fieldErrors(SignupSchema, { email: "a@b.co", password: "😀".repeat(15) })).toEqual({});
  });

  it("rejects passwords longer than 128 characters", () => {
    const errors = fieldErrors(SignupSchema, { email: "a@b.co", password: "a".repeat(129) });
    expect(errors.password).toEqual(["Use at most 128 characters"]);
  });

  it("reports every invalid field at once", () => {
    const errors = fieldErrors(SignupSchema, { email: "nope", password: "short" });
    expect(Object.keys(errors).sort()).toEqual(["email", "password"]);
  });
});

describe("LoginSchema", () => {
  it("doesn't re-check the signup rules, so older passwords still work", () => {
    expect(LoginSchema.parse({ email: " A@B.CO", password: "x" })).toEqual({
      email: "a@b.co",
      password: "x",
    });
  });

  it("asks for a password when it is empty", () => {
    expect(fieldErrors(LoginSchema, { email: "a@b.co", password: "" }).password).toEqual([
      "Enter your password",
    ]);
  });
});