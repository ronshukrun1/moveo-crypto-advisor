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
import { ImgflipClient } from './imgflip.client';

describe('ImgflipClient', () => {
  let imgflipClient: ImgflipClient;
  let httpService: { post: jest.Mock };

  const captions = {
    templateId: 181913649,
    text0: 'BTC moved +2.2% in 24 hours',
    text1: 'Me checking the dashboard again',
  };

  const successResponse = {
    success: true,
    data: {
      url: 'https://i.imgflip.com/example.jpg',
      page_url: 'https://imgflip.com/i/example',
    },
  };

  beforeEach(async () => {
    httpService = {
      post: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImgflipClient,
        {
          provide: HttpService,
          useValue: httpService,
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn((key: string) => {
              const values: Record<string, string | number> = {
                IMGFLIP_BASE_URL: 'https://api.imgflip.com',
                IMGFLIP_USERNAME: 'test-imgflip-username',
                IMGFLIP_PASSWORD: 'test-imgflip-password',
                IMGFLIP_TIMEOUT_MS: 5000,
              };

              return values[key];
            }),
          },
        },
      ],
    }).compile();

    imgflipClient = module.get(ImgflipClient);
  });

  it('sends a form-urlencoded caption_image request with credentials and captions', async () => {
    httpService.post.mockReturnValue(of({ data: successResponse }));

    const result = await imgflipClient.captionImage(captions);

    expect(result).toEqual({
      url: 'https://i.imgflip.com/example.jpg',
      pageUrl: 'https://imgflip.com/i/example',
    });
    expect(httpService.post).toHaveBeenCalledWith(
      'https://api.imgflip.com/caption_image',
      'template_id=181913649&username=test-imgflip-username&password=test-imgflip-password&text0=BTC+moved+%2B2.2%25+in+24+hours&text1=Me+checking+the+dashboard+again',
      {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );
  });

  it('treats HTTP 200 with success=false as failure', async () => {
    httpService.post.mockReturnValue(
      of({
        data: {
          success: false,
          error_message: 'Invalid username/password combination',
        },
      }),
    );

    await expect(imgflipClient.captionImage(captions)).rejects.toBeInstanceOf(
      BadGatewayException,
    );
  });

  it('maps invalid credentials responses safely without exposing error_message', async () => {
    httpService.post.mockReturnValue(
      of({
        data: {
          success: false,
          error_message: 'Invalid username/password combination',
        },
      }),
    );

    await expect(imgflipClient.captionImage(captions)).rejects.toMatchObject({
      message: 'Unable to generate meme',
    });
  });

  it('maps invalid template responses safely', async () => {
    httpService.post.mockReturnValue(
      of({
        data: {
          success: false,
          error_message: 'Invalid template id',
        },
      }),
    );

    await expect(imgflipClient.captionImage(captions)).rejects.toBeInstanceOf(
      BadGatewayException,
    );
  });

  it('maps missing text failures safely', async () => {
    httpService.post.mockReturnValue(
      of({
        data: {
          success: false,
          error_message: 'Missing text0',
        },
      }),
    );

    await expect(imgflipClient.captionImage(captions)).rejects.toBeInstanceOf(
      BadGatewayException,
    );
  });

  it('maps malformed success responses safely', async () => {
    httpService.post.mockReturnValue(
      of({
        data: {
          success: true,
          data: {
            url: '',
            page_url: 'https://imgflip.com/i/example',
          },
        },
      }),
    );

    await expect(imgflipClient.captionImage(captions)).rejects.toBeInstanceOf(
      BadGatewayException,
    );
  });

  it('maps timeout errors to 504', async () => {
    const timeoutError = new AxiosError('timeout');
    timeoutError.code = 'ECONNABORTED';

    httpService.post.mockReturnValue(throwError(() => timeoutError));

    await expect(imgflipClient.captionImage(captions)).rejects.toBeInstanceOf(
      GatewayTimeoutException,
    );
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

    await expect(imgflipClient.captionImage(captions)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('maps network failures to 502', async () => {
    const networkError = new AxiosError('network error');

    httpService.post.mockReturnValue(throwError(() => networkError));

    await expect(imgflipClient.captionImage(captions)).rejects.toBeInstanceOf(
      BadGatewayException,
    );
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

    await expect(imgflipClient.captionImage(captions)).rejects.toBeInstanceOf(
      BadGatewayException,
    );
  });
});
