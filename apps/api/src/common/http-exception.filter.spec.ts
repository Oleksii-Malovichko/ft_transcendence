import { type ArgumentsHost, BadRequestException, NotFoundException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { toErrorBody } from "./http-exception.filter.js";

describe("toErrorBody", () => {
  it("keeps the status and message of an HTTP exception", () => {
    expect(toErrorBody(new NotFoundException("No such user"))).toEqual({
      statusCode: 404,
      error: "Not Found",
      message: "No such user",
    });
  });

  it("keeps the per-field problems of a validation error", () => {
    const fields = { email: ["Enter a valid email address"] };
    const body = toErrorBody(new BadRequestException({ message: "Invalid input", fields }));
    expect(body).toEqual({
      statusCode: 400,
      error: "Bad Request",
      message: "Invalid input",
      fields,
    });
  });

  it("hides what an unexpected error says", () => {
    const body = toErrorBody(new Error("connect ECONNREFUSED 10.0.0.5:5432"));
    expect(body).toEqual({
      statusCode: 500,
      error: "Internal Server Error",
      message: "Something went wrong on our side.",
    });
  });
});

describe("HttpExceptionFilter", () => {
  it("answers with that shape and status", async () => {
    const { HttpExceptionFilter } = await import("./http-exception.filter.js");
    const sent: { status?: number; body?: unknown } = {};
    const response = {
      status(code: number) {
        sent.status = code;
        return this;
      },
      json(body: unknown) {
        sent.body = body;
      },
    };
    const host = {
      getType: () => "http",
      switchToHttp: () => ({ getResponse: () => response }),
    } as unknown as ArgumentsHost;
    new HttpExceptionFilter().catch(new NotFoundException(), host);
    expect(sent.status).toBe(404);
    expect(sent.body).toMatchObject({ statusCode: 404, error: "Not Found" });
  });
});
