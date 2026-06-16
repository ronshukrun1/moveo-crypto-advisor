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
import { OpenRouterChatMessage } from './interfaces/open-router.interfaces';
import { parseOpenRouterChatCompletionContent } from './utils/open-router-response.guards';

@Injectable()
export class OpenRouterClient {
  private readonly logger = new Logger(OpenRouterClient.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async generateInsightContent(
    messages: OpenRouterChatMessage[],
  ): Promise<string> {
    const baseUrl = this.configService.getOrThrow<string>(
      'OPENROUTER_BASE_URL',
    );
    const apiKey = this.configService.getOrThrow<string>('OPENROUTER_API_KEY');
    const model = this.configService.getOrThrow<string>('OPENROUTER_MODEL');
    const timeoutMs = this.configService.getOrThrow<number>(
      'OPENROUTER_TIMEOUT_MS',
    );

    const requestUrl = new URL(
      'chat/completions',
      baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`,
    ).toString();

    try {
      const response = await firstValueFrom(
        this.httpService.post<unknown>(
          requestUrl,
          {
            model,
            messages,
            response_format: { type: 'json_object' },
            temperature: 0.2,
          },
          {
            timeout: timeoutMs,
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      return parseOpenRouterChatCompletionContent(response.data);
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
        this.logger.warn('OpenRouter request timed out');
        return new GatewayTimeoutException('AI insight request timed out');
      }

      const status = error.response?.status;

      if (status === 401 || status === 403) {
        this.logger.warn(
          `OpenRouter authentication failed with status ${status}`,
        );
        return new BadGatewayException('Unable to generate insight');
      }

      if (status === 429) {
        this.logger.warn('OpenRouter rate limit reached');
        return new ServiceUnavailableException(
          'AI insight service is temporarily unavailable',
        );
      }

      if (status !== undefined && status >= 500) {
        this.logger.warn(`OpenRouter upstream error with status ${status}`);
        return new BadGatewayException('Unable to generate insight');
      }

      if (!error.response) {
        this.logger.warn('OpenRouter network request failed');
        return new BadGatewayException('Unable to generate insight');
      }

      this.logger.warn(`OpenRouter request failed with status ${status}`);
      return new BadGatewayException('Unable to generate insight');
    }

    this.logger.error('Unexpected OpenRouter client error');
    return new BadGatewayException('Unable to generate insight');
  }
}
