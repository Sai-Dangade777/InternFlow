import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus
} from "@nestjs/common";
import type { Request, Response } from "express";
import { PinoLogger } from "nestjs-pino";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: PinoLogger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse =
      exception instanceof HttpException ? exception.getResponse() : undefined;

    const normalized =
      typeof errorResponse === "string"
        ? { message: errorResponse }
        : (errorResponse as Record<string, unknown> | undefined);

    const payload = {
      statusCode: status,
      path: request.url,
      timestamp: new Date().toISOString(),
      ...(normalized || { message: "Unexpected error" })
    };

    this.logger.error(
      { err: exception, statusCode: status, path: request.url },
      "Request failed"
    );

    response.status(status).json(payload);
  }
}
