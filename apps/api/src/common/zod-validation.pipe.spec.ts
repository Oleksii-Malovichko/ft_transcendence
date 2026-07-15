import { SignupSchema } from "@ft/core";
import { BadRequestException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { ZodValidationPipe } from "./zod-validation.pipe.js";

const pipe = new ZodValidationPipe(SignupSchema);
const PASSWORD = "seven purple lanterns hum";

describe("ZodValidationPipe", () => {
  it("hands the parsed, normalized value to the handler", () => {
    expect(pipe.transform({ email: "  Bob@Example.COM ", password: PASSWORD })).toEqual({
      email: "bob@example.com",
      password: PASSWORD,
    });
  });

  it("refuses invalid input with the problems per field", () => {
    let thrown: unknown;
    try {
      pipe.transform({ email: "nope", password: "short" });
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeInstanceOf(BadRequestException);
    const body = (thrown as BadRequestException).getResponse() as {
      fields: Record<string, string[]>;
    };
    expect(Object.keys(body.fields).sort()).toEqual(["email", "password"]);
  });
});
