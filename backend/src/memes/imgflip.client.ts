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
import {
  CaptionImageParams,
  CaptionImageResult,
} from './interfaces/imgflip.interfaces';
import { parseImgflipCaptionImageResponse } from './utils/imgflip-response.guards';

@Injectable()
export class ImgflipClient {
  private readonly logger = new Logger(ImgflipClient.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async captionImage(params: CaptionImageParams): Promise<CaptionImageResult> {
    const baseUrl = this.configService.getOrThrow<string>('IMGFLIP_BASE_URL');
    const username = this.configService.getOrThrow<string>('IMGFLIP_USERNAME');
    const password = this.configService.getOrThrow<string>('IMGFLIP_PASSWORD');
    const timeoutMs =
      this.configService.getOrThrow<number>('IMGFLIP_TIMEOUT_MS');

    const requestUrl = new URL(
      'caption_image',
      baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`,
    ).toString();

    const formBody = new URLSearchParams({
      template_id: String(params.templateId),
      username,
      password,
      text0: params.text0,
      text1: params.text1,
    });

    try {
      const response = await firstValueFrom(
        this.httpService.post<unknown>(requestUrl, formBody.toString(), {
          timeout: timeoutMs,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }),
      );

      return parseImgflipCaptionImageResponse(response.data);
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
        this.logger.warn('Imgflip request timed out');
        return new GatewayTimeoutException('Meme generation request timed out');
      }

      const status = error.response?.status;

      if (status === 401 || status === 403) {
        this.logger.warn(`Imgflip authentication failed with status ${status}`);
        return new BadGatewayException('Unable to generate meme');
      }

      if (status === 429) {
        this.logger.warn('Imgflip rate limit reached');
        return new ServiceUnavailableException(
          'Meme service is temporarily unavailable',
        );
      }

      if (status !== undefined && status >= 500) {
        this.logger.warn(`Imgflip upstream error with status ${status}`);
        return new BadGatewayException('Unable to generate meme');
      }

      if (!error.response) {
        this.logger.warn('Imgflip network request failed');
        return new BadGatewayException('Unable to generate meme');
      }

      this.logger.warn(`Imgflip request failed with status ${status}`);
      return new BadGatewayException('Unable to generate meme');
    }

    this.logger.error('Unexpected Imgflip client error');
    return new BadGatewayException('Unable to generate meme');
  }
}
