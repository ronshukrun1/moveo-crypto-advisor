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
import { CoinGeckoClient } from './coin-gecko.client';

describe('CoinGeckoClient', () => {
  let coinGeckoClient: CoinGeckoClient;
  let httpService: { get: jest.Mock };

  const validMarketItem = {
    id: 'bitcoin',
    symbol: 'btc',
    name: 'Bitcoin',
    image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
    current_price: 65823,
    market_cap: 1319912956634,
    market_cap_rank: 1,
    total_volume: 25204772698,
    high_24h: 65893,
    low_24h: 63663,
    price_change_24h: 1395.9,
    price_change_percentage_24h: 2.17,
    last_updated: '2026-06-15T06:11:30.617Z',
  };

  beforeEach(async () => {
    httpService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoinGeckoClient,
        {
          provide: HttpService,
          useValue: httpService,
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn((key: string) => {
              const values: Record<string, string | number> = {
                COINGECKO_BASE_URL: 'https://api.coingecko.com/api/v3',
                COINGECKO_API_KEY: 'test-coingecko-api-key',
                COINGECKO_TIMEOUT_MS: 5000,
              };

              return values[key];
            }),
          },
        },
      ],
    }).compile();

    coinGeckoClient = module.get(CoinGeckoClient);
  });

  it('sends one request with comma-separated CoinGecko IDs', async () => {
    httpService.get.mockReturnValue(of({ data: [validMarketItem] }));

    await coinGeckoClient.fetchMarkets(['bitcoin', 'ethereum']);

    expect(httpService.get).toHaveBeenCalledWith(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin%2Cethereum&order=market_cap_desc&sparkline=false&price_change_percentage=24h',
      {
        headers: {
          'x-cg-demo-api-key': 'test-coingecko-api-key',
        },
        timeout: 5000,
      },
    );
  });

  it('maps timeout failures to 504', async () => {
    const timeoutError = new AxiosError('timeout');
    timeoutError.code = 'ECONNABORTED';
    httpService.get.mockReturnValue(throwError(() => timeoutError));

    await expect(
      coinGeckoClient.fetchMarkets(['bitcoin']),
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
      coinGeckoClient.fetchMarkets(['bitcoin']),
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
      coinGeckoClient.fetchMarkets(['bitcoin']),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('throws a safe upstream error for invalid top-level responses', async () => {
    httpService.get.mockReturnValue(of({ data: { invalid: true } }));

    await expect(
      coinGeckoClient.fetchMarkets(['bitcoin']),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });

  it('filters invalid market items without crashing', async () => {
    httpService.get.mockReturnValue(
      of({
        data: [validMarketItem, { id: '', symbol: 123 }],
      }),
    );

    const result = await coinGeckoClient.fetchMarkets(['bitcoin']);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('bitcoin');
  });
});
