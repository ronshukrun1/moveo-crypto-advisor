import {
  ArgumentsHost,
  BadRequestException,
  HttpException,
  HttpStatus,
  ServiceUnavailableException,
} from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  const filter = new HttpExceptionFilter();
  let json: jest.Mock;
  let status: jest.Mock;
  let host: ArgumentsHost;

  beforeEach(() => {
    json = jest.fn();
    status = jest.fn().mockReturnValue({ json });
    host = {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
        getRequest: () => ({ url: '/api/health' }),
      }),
    } as ArgumentsHost;
  });

  it('formats validation errors with safe details', () => {
    filter.catch(
      new BadRequestException({
        message: ['page must be an integer number'],
        error: 'Bad Request',
      }),
      host,
    );

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: 'Validation failed',
        error: 'Bad Request',
        path: '/api/health',
        details: ['page must be an integer number'],
      }),
    );
  });

  it('preserves safe custom fields such as database status', () => {
    filter.catch(
      new ServiceUnavailableException({
        message: 'Service unavailable',
        database: { status: 'down' },
      }),
      host,
    );

    expect(status).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 503,
        message: 'Service unavailable',
        error: 'Service Unavailable',
        database: { status: 'down' },
      }),
    );
    const calls = json.mock.calls as Array<[Record<string, unknown>]>;
    const responseBody = calls[0]?.[0];
    expect(JSON.stringify(responseBody)).not.toContain('password');
  });

  it('returns a generic message for unexpected errors', () => {
    filter.catch(new Error('database password leaked'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        message: 'Internal server error',
        error: 'Internal Server Error',
        path: '/api/health',
      }),
    );
  });

  it('formats string-based HttpExceptions', () => {
    filter.catch(new HttpException('Not allowed', HttpStatus.FORBIDDEN), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 403,
        message: 'Not allowed',
      }),
    );
  });
});
