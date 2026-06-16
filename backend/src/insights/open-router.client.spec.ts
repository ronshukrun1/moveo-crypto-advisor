import {
  BadGatewayException,
  GatewayTimeoutException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { AxiosError, AxiosHeaders } from 'axios';
import { of, throwError } from 'rxjs';
import { OpenRouterClient } from './open-router.client';

describe('OpenRouterClient', () => {
  let openRouterClient: OpenRouterClient;
  let httpService: { post: jest.Mock };

  const messages = [
    { role: 'system' as const, content: 'System prompt' },
    { role: 'user' as const, content: 'User prompt' },
  ];

  beforeEach(async () => {
    httpService = {
      post: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpenRouterClient,
        {
          provide: HttpService,
          useValue: httpService,
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn((key: string) => {
              const values: Record<string, string | number> = {
                OPENROUTER_BASE_URL: 'https://openrouter.ai/api/v1',
                OPENROUTER_API_KEY: 'test-openrouter-api-key',
                OPENROUTER_MODEL: 'openai/gpt-oss-20b:free',
                OPENROUTER_TIMEOUT_MS: 10000,
              };

              return values[key];
            }),
          },
        },
      ],
    }).compile();

    openRouterClient = module.get(OpenRouterClient);
  });

  it('sends one chat completion request with configured model and auth', async () => {
    httpService.post.mockReturnValue(
      of({
        data: {
          choices: [
            {
              message: {
                content:
                  '{"title":"Bitcoin Update","insight":"Bitcoin rose during the last 24 hours. Recent headlines reflected ongoing market activity."}',
              },
            },
          ],
        },
      }),
    );

    const result = await openRouterClient.generateInsightContent(messages);

    expect(result).toContain('Bitcoin Update');
    expect(httpService.post).toHaveBeenCalledWith(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openai/gpt-oss-20b:free',
        messages,
        response_format: { type: 'json_object' },
        temperature: 0.2,
      },
      {
        timeout: 10000,
        headers: {
          Authorization: 'Bearer test-openrouter-api-key',
          'Content-Type': 'application/json',
        },
      },
    );
  });

  it('maps timeout errors to 504', async () => {
    const timeoutError = new AxiosError('timeout');
    timeoutError.code = 'ECONNABORTED';

    httpService.post.mockReturnValue(throwError(() => timeoutError));

    await expect(
      openRouterClient.generateInsightContent(messages),
    ).rejects.toBeInstanceOf(GatewayTimeoutException);
  });

  it('maps authentication failures to 502', async () => {
    const authError = new AxiosError('unauthorized');
    authError.response = {
      status: 401,
      statusText: 'Unauthorized',
      headers: {},
      config: { headers: new AxiosHeaders() },
      data: {},
    };

    httpService.post.mockReturnValue(throwError(() => authError));

    await expect(
      openRouterClient.generateInsightContent(messages),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });

  it('maps rate limits to 503', async () => {
    const rateLimitError = new AxiosError('rate limit');
    rateLimitError.response = {
      status: 429,
      statusText: 'Too Many Requests',
      headers: {},
      config: { headers: new AxiosHeaders() },
      data: {},
    };

    httpService.post.mockReturnValue(throwError(() => rateLimitError));

    await expect(
      openRouterClient.generateInsightContent(messages),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('maps upstream 5xx failures to 502', async () => {
    const upstreamError = new AxiosError('server error');
    upstreamError.response = {
      status: 500,
      statusText: 'Internal Server Error',
      headers: {},
      config: { headers: new AxiosHeaders() },
      data: {},
    };

    httpService.post.mockReturnValue(throwError(() => upstreamError));

    await expect(
      openRouterClient.generateInsightContent(messages),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });

  it('maps network failures to 502', async () => {
    const networkError = new AxiosError('network error');

    httpService.post.mockReturnValue(throwError(() => networkError));

    await expect(
      openRouterClient.generateInsightContent(messages),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });

  it('rejects empty choices with 502', async () => {
    httpService.post.mockReturnValue(
      of({
        data: {
          choices: [],
        },
      }),
    );

    await expect(
      openRouterClient.generateInsightContent(messages),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });

  it('rejects null content with 502', async () => {
    httpService.post.mockReturnValue(
      of({
        data: {
          choices: [
            {
              message: {
                content: null,
              },
            },
          ],
        },
      }),
    );

    await expect(
      openRouterClient.generateInsightContent(messages),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });
});
