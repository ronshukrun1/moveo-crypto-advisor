import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

const HTTP_ERROR_NAMES: Record<number, string> = {
  400: 'Bad Request',
  403: 'Forbidden',
  404: 'Not Found',
  500: 'Internal Server Error',
  503: 'Service Unavailable',
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const timestamp = new Date().toISOString();
    const path = request.url;

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      const body = this.buildHttpExceptionBody(
        status,
        exceptionResponse,
        timestamp,
        path,
      );

      response.status(status).json(body);
      return;
    }

    this.logger.error(
      'Unexpected server error',
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      error: 'Internal Server Error',
      timestamp,
      path,
    });
  }

  private buildHttpExceptionBody(
    status: number,
    exceptionResponse: string | object,
    timestamp: string,
    path: string,
  ): Record<string, unknown> {
    if (typeof exceptionResponse === 'string') {
      return {
        statusCode: status,
        message: exceptionResponse,
        error: this.getErrorName(status),
        timestamp,
        path,
      };
    }

    const responseObject = exceptionResponse as Record<string, unknown>;
    const rawMessage = responseObject.message;
    const details = Array.isArray(rawMessage)
      ? rawMessage.map(String)
      : undefined;
    const message =
      typeof rawMessage === 'string'
        ? rawMessage
        : details
          ? 'Validation failed'
          : 'Error';

    const body: Record<string, unknown> = {
      statusCode: status,
      message,
      error:
        typeof responseObject.error === 'string'
          ? responseObject.error
          : this.getErrorName(status),
      timestamp,
      path,
    };

    if (details) {
      body.details = details;
    }

    if (responseObject.database) {
      body.database = responseObject.database;
    }

    return body;
  }

  private getErrorName(status: number): string {
    return HTTP_ERROR_NAMES[status] ?? 'Error';
  }
}
