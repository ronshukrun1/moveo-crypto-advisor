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
import { NewsDataClient } from './news-data.client';

describe('NewsDataClient', () => {
  let newsDataClient: NewsDataClient;
  let httpService: { get: jest.Mock };

  const validArticle = {
    article_id: 'article-1',
    link: 'https://example.com/article-1',
    title: 'Bitcoin market update',
    description: 'Short description',
    keywords: ['bitcoin'],
    creator: ['Author Name'],
    coin: ['BTC'],
    language: 'english',
    pubDate: '2026-06-14 19:30:38',
    image_url: 'https://example.com/image.jpg',
    source_id: 'source-1',
    source_name: 'Source Name',
    source_url: 'https://example.com',
  };

  beforeEach(async () => {
    httpService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NewsDataClient,
        {
          provide: HttpService,
          useValue: httpService,
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn((key: string) => {
              const values: Record<string, string | number> = {
                NEWSDATA_BASE_URL: 'https://newsdata.io/api/1/crypto',
                NEWSDATA_API_KEY: 'test-newsdata-api-key',
                NEWSDATA_TIMEOUT_MS: 5000,
              };

              return values[key];
            }),
          },
        },
      ],
    }).compile();

    newsDataClient = module.get(NewsDataClient);
  });

  it('sends one request with selected symbols, limit, and pagination token', async () => {
    httpService.get.mockReturnValue(
      of({
        data: {
          status: 'success',
          totalResults: 1,
          results: [validArticle],
          nextPage: 'next-token',
        },
      }),
    );

    const result = await newsDataClient.fetchNews({
      symbols: ['BTC', 'ETH'],
      limit: 5,
      page: 'page-token',
    });

    expect(httpService.get).toHaveBeenCalledWith(
      'https://newsdata.io/api/1/crypto?apikey=test-newsdata-api-key&coin=btc%2Ceth&language=en&size=5&page=page-token',
      { timeout: 5000 },
    );
    expect(result.nextPage).toBe('next-token');
  });

  it('maps timeout failures to 504', async () => {
    const timeoutError = new AxiosError('timeout');
    timeoutError.code = 'ECONNABORTED';
    httpService.get.mockReturnValue(throwError(() => timeoutError));

    await expect(
      newsDataClient.fetchNews({ symbols: ['BTC'], limit: 5 }),
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
    httpService.get.mockReturnValue(throwError(() => authError));

    await expect(
      newsDataClient.fetchNews({ symbols: ['BTC'], limit: 5 }),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });

  it('maps rate limit failures to 503', async () => {
    const rateLimitError = new AxiosError('rate limit');
    rateLimitError.response = {
      status: 429,
      statusText: 'Too Many Requests',
      headers: {},
      config: { headers: new AxiosHeaders() },
      data: {},
    };
    httpService.get.mockReturnValue(throwError(() => rateLimitError));

    await expect(
      newsDataClient.fetchNews({ symbols: ['BTC'], limit: 5 }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('throws a safe upstream error for malformed responses', async () => {
    httpService.get.mockReturnValue(of({ data: { status: 'error' } }));

    await expect(
      newsDataClient.fetchNews({ symbols: ['BTC'], limit: 5 }),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });

  it('filters invalid articles without crashing', async () => {
    httpService.get.mockReturnValue(
      of({
        data: {
          status: 'success',
          totalResults: 2,
          results: [validArticle, { article_id: '', link: '', title: '' }],
          nextPage: null,
        },
      }),
    );

    const result = await newsDataClient.fetchNews({
      symbols: ['BTC'],
      limit: 5,
    });

    expect(result.results).toHaveLength(1);
  });
});
