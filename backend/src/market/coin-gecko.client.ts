import {
  BadGatewayException,
  GatewayTimeoutException,
  HttpException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { CoinGeckoMarketItem } from './interfaces/coin-gecko-market-item.interface';
import { parseCoinGeckoMarketsResponse } from './utils/coin-gecko-response.guards';

@Injectable()
export class CoinGeckoClient {
  private readonly logger = new Logger(CoinGeckoClient.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async fetchMarkets(coingeckoIds: string[]): Promise<CoinGeckoMarketItem[]> {
    const baseUrl = this.configService.getOrThrow<string>('COINGECKO_BASE_URL');
    const apiKey = this.configService.getOrThrow<string>('COINGECKO_API_KEY');
    const timeoutMs = this.configService.getOrThrow<number>(
      'COINGECKO_TIMEOUT_MS',
    );

    const query = new URLSearchParams({
      vs_currency: 'usd',
      ids: coingeckoIds.join(','),
      order: 'market_cap_desc',
      sparkline: 'false',
      price_change_percentage: '24h',
    });

    const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    const requestUrl = new URL('coins/markets', normalizedBaseUrl);
    requestUrl.search = query.toString();

    try {
      const response = await firstValueFrom(
        this.httpService.get<unknown>(requestUrl.toString(), {
          headers: {
            'x-cg-demo-api-key': apiKey,
          },
          timeout: timeoutMs,
        }),
      );

      return parseCoinGeckoMarketsResponse(response.data);
    } catch (error) {
      throw this.mapRequestError(error);
    }
  }

  private mapRequestError(error: unknown): HttpException {
    if (error instanceof HttpException) {
      return error;
    }

    if (error instanceof AxiosError) {
      if (error.code === 'ECONNABORTED') {
        this.logger.warn('CoinGecko request timed out');
        return new GatewayTimeoutException(
          'Market data provider request timed out',
        );
      }

      const status = error.response?.status;

      if (status === 401 || status === 403) {
        this.logger.warn(
          `CoinGecko authentication failed with status ${status}`,
        );
        return new BadGatewayException(
          'Market data provider authentication failed',
        );
      }

      if (status === 429) {
        this.logger.warn('CoinGecko rate limit reached');
        return new ServiceUnavailableException(
          'Market data provider is temporarily unavailable',
        );
      }

      if (status !== undefined && status >= 500) {
        this.logger.warn(`CoinGecko upstream error with status ${status}`);
        return new BadGatewayException('Market data provider is unavailable');
      }

      if (!error.response) {
        this.logger.warn('CoinGecko network request failed');
        return new BadGatewayException('Market data provider is unavailable');
      }

      this.logger.warn(`CoinGecko request failed with status ${status}`);
      return new BadGatewayException('Market data provider is unavailable');
    }

    this.logger.error('Unexpected CoinGecko client error');
    return new BadGatewayException('Market data provider is unavailable');
  }
}
