import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  Logger,
} from "@nestjs/common";
import type { Response } from "express";

export interface ErrorBody {
  statusCode: number;
  error: string;
  message: string;
  fields?: Record<string, string[]>;
}

const STATUS_NAMES: Record<number, string> = {
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  409: "Conflict",
  500: "Internal Server Error",
};

/** Turns anything thrown into the one shape the frontend can rely on. */
export function toErrorBody(exception: unknown): ErrorBody {
  if (!(exception instanceof HttpException)) {
    return {
      statusCode: 500,
      error: STATUS_NAMES[500]!,
      message: "Something went wrong on our side.",
    };
  }
  const statusCode = exception.getStatus();
  const payload = exception.getResponse();
  if (typeof payload === "string") {
    return { statusCode, error: STATUS_NAMES[statusCode] ?? "Error", message: payload };
  }
  const details = payload as Partial<ErrorBody> & { message?: string | string[] };
  return {
    statusCode,
    error: details.error ?? STATUS_NAMES[statusCode] ?? "Error",
    message: Array.isArray(details.message)
      ? details.message.join(", ")
      : (details.message ?? "Request failed"),
    ...(details.fields ? { fields: details.fields } : {}),
  };
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    if (host.getType() !== "http") {
      this.logger.error("Error outside an HTTP request", describe(exception));
      return;
    }
    const body = toErrorBody(exception);
    if (body.statusCode >= 500) {
      this.logger.error(`${body.statusCode} on a request`, describe(exception));
    }
    host.switchToHttp().getResponse<Response>().status(body.statusCode).json(body);
  }
}

function describe(exception: unknown): string {
  return exception instanceof Error ? (exception.stack ?? exception.message) : String(exception);
}
