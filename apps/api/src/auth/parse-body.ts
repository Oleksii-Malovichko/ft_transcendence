import { BadRequestException } from "@nestjs/common";
import { z } from "zod";

export function parseBody<T extends z.ZodType>(schema: T, body: unknown): z.output<T> {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new BadRequestException({
      statusCode: 400,
      error: "Bad Request",
      message: "Invalid input",
      fields: z.flattenError(result.error).fieldErrors,
    });
  }
  return result.data;
}