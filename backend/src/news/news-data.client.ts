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
import { NewsDataResponse } from './interfaces/news-data.interfaces';
import { parseNewsDataResponse } from './utils/news-data-response.guards';

export interface FetchNewsParams {
  symbols: string[];
  limit: number;
  page?: string;
}

@Injectable()
export class NewsDataClient {
  private readonly logger = new Logger(NewsDataClient.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async fetchNews(params: FetchNewsParams): Promise<NewsDataResponse> {
    const baseUrl = this.configService.getOrThrow<string>('NEWSDATA_BASE_URL');
    const apiKey = this.configService.getOrThrow<string>('NEWSDATA_API_KEY');
    const timeoutMs = this.configService.getOrThrow<number>(
      'NEWSDATA_TIMEOUT_MS',
    );

    const query = new URLSearchParams({
      apikey: apiKey,
      coin: params.symbols.map((symbol) => symbol.toLowerCase()).join(','),
      language: 'en',
      size: String(params.limit),
    });

    if (params.page) {
      query.set('page', params.page);
    }

    const requestUrl = new URL(baseUrl);
    requestUrl.search = query.toString();

    try {
      const response = await firstValueFrom(
        this.httpService.get<unknown>(requestUrl.toString(), {
          timeout: timeoutMs,
        }),
      );

      return parseNewsDataResponse(response.data);
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
        this.logger.warn('NewsData request timed out');
        return new GatewayTimeoutException('News request timed out');
      }

      const status = error.response?.status;

      if (status === 401 || status === 403) {
        this.logger.warn(
          `NewsData authentication failed with status ${status}`,
        );
        return new BadGatewayException('Unable to retrieve news');
      }

      if (status === 429) {
        this.logger.warn('NewsData rate limit reached');
        return new ServiceUnavailableException(
          'News service is temporarily unavailable',
        );
      }

      if (status !== undefined && status >= 500) {
        this.logger.warn(`NewsData upstream error with status ${status}`);
        return new BadGatewayException('Unable to retrieve news');
      }

      if (!error.response) {
        this.logger.warn('NewsData network request failed');
        return new BadGatewayException('Unable to retrieve news');
      }

      this.logger.warn(`NewsData request failed with status ${status}`);
      return new BadGatewayException('Unable to retrieve news');
    }

    this.logger.error('Unexpected NewsData client error');
    return new BadGatewayException('Unable to retrieve news');
  }
}
