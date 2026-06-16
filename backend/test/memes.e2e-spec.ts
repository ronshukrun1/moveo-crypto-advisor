import {
  BadGatewayException,
  GatewayTimeoutException,
  INestApplication,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { configureApplication } from '../src/app.setup';
import { CoinGeckoClient } from '../src/market/coin-gecko.client';
import { ImgflipClient } from '../src/memes/imgflip.client';
import { InvestorProfile } from '../src/preferences/enums/investor-profile.enum';

interface DailyMemeResponse {
  imageUrl: string;
  pageUrl: string;
  textTop: string;
  textBottom: string;
  generatedAt: string;
}

interface LoginResponseBody {
  accessToken: string;
}

interface ErrorResponseBody {
  statusCode: number;
  message: string;
}

const mockMarketItem = {
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

describe('Memes (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let coinGeckoClient: { fetchMarkets: jest.Mock };
  let imgflipClient: { captionImage: jest.Mock };

  const registerPayload = {
    name: 'Ron',
    email: 'memes-user@example.com',
    password: 'StrongPass123!',
  };

  const onboardingPayload = {
    investorProfile: InvestorProfile.LONG_TERM_HOLDER,
    showMarketPrices: true,
    showNews: true,
    showAiInsight: true,
    showMeme: true,
    coinIds: [1, 2],
  };

  beforeAll(async () => {
    coinGeckoClient = { fetchMarkets: jest.fn() };
    imgflipClient = { captionImage: jest.fn() };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(CoinGeckoClient)
      .useValue(coinGeckoClient)
      .overrideProvider(ImgflipClient)
      .useValue(imgflipClient)
      .compile();

    app = moduleFixture.createNestApplication();
    configureApplication(app, app.get(ConfigService));
    await app.init();

    dataSource = app.get(DataSource);
  });

  beforeEach(async () => {
    coinGeckoClient.fetchMarkets.mockReset();
    imgflipClient.captionImage.mockReset();

    await dataSource.query('DELETE FROM user_selected_coins');
    await dataSource.query('DELETE FROM user_preferences');
    await dataSource.query('DELETE FROM users');
  });

  afterAll(async () => {
    await app.close();
  });

  async function registerAndLogin(): Promise<string> {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(registerPayload)
      .expect(201);

    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: registerPayload.email,
        password: registerPayload.password,
      })
      .expect(200);

    return (loginResponse.body as LoginResponseBody).accessToken;
  }

  async function onboardUser(token: string): Promise<void> {
    await request(app.getHttpServer())
      .post('/api/onboarding')
      .set('Authorization', `Bearer ${token}`)
      .send(onboardingPayload)
      .expect(200);
  }

  function mockExternalDependencies(): void {
    coinGeckoClient.fetchMarkets.mockResolvedValue([
      mockMarketItem,
      {
        ...mockMarketItem,
        id: 'ethereum',
        symbol: 'eth',
        name: 'Ethereum',
        price_change_percentage_24h: -5.1,
      },
    ]);
    imgflipClient.captionImage.mockResolvedValue({
      url: 'https://i.imgflip.com/example.jpg',
      pageUrl: 'https://imgflip.com/i/example',
    });
  }

  it('GET /api/memes/daily without token returns 401', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/memes/daily')
      .expect(401);

    expect((response.body as ErrorResponseBody).statusCode).toBe(401);
  });

  it('returns 400 when the user has no selected coins', async () => {
    const token = await registerAndLogin();

    const response = await request(app.getHttpServer())
      .get('/api/memes/daily')
      .set('Authorization', `Bearer ${token}`)
      .expect(400);

    expect((response.body as ErrorResponseBody).message).toBe(
      'Select at least one coin before generating a meme',
    );
    expect(imgflipClient.captionImage).not.toHaveBeenCalled();
  });

  it('returns a mapped meme for an authenticated onboarded user', async () => {
    const token = await registerAndLogin();
    await onboardUser(token);
    mockExternalDependencies();

    const response = await request(app.getHttpServer())
      .get('/api/memes/daily')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const body = response.body as DailyMemeResponse;
    expect(body.imageUrl).toBe('https://i.imgflip.com/example.jpg');
    expect(body.pageUrl).toBe('https://imgflip.com/i/example');
    expect(body.textTop).toBe('ETH moved -5.1% in 24 hours');
    expect(body.textBottom).toBe('Me checking the dashboard again');
    expect(body.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(imgflipClient.captionImage).toHaveBeenCalled();
  });

  it('does not expose credentials or raw Imgflip fields', async () => {
    const token = await registerAndLogin();
    await onboardUser(token);
    mockExternalDependencies();

    const response = await request(app.getHttpServer())
      .get('/api/memes/daily')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const serialized = JSON.stringify(response.body);
    expect(serialized).not.toContain('username');
    expect(serialized).not.toContain('password');
    expect(serialized).not.toContain('success');
    expect(serialized).not.toContain('error_message');
    expect(serialized).not.toContain('test-imgflip-password');
  });

  it('rejects unknown query fields such as userId', async () => {
    const token = await registerAndLogin();

    const response = await request(app.getHttpServer())
      .get('/api/memes/daily?userId=999')
      .set('Authorization', `Bearer ${token}`)
      .expect(400);

    expect((response.body as ErrorResponseBody).statusCode).toBe(400);
  });

  it('returns 502 when Imgflip reports success=false', async () => {
    const token = await registerAndLogin();
    await onboardUser(token);
    mockExternalDependencies();
    imgflipClient.captionImage.mockRejectedValue(
      new BadGatewayException('Unable to generate meme'),
    );

    const response = await request(app.getHttpServer())
      .get('/api/memes/daily')
      .set('Authorization', `Bearer ${token}`)
      .expect(502);

    expect((response.body as ErrorResponseBody).statusCode).toBe(502);
  });

  it('returns 502 for invalid template failures', async () => {
    const token = await registerAndLogin();
    await onboardUser(token);
    mockExternalDependencies();
    imgflipClient.captionImage.mockRejectedValue(
      new BadGatewayException('Unable to generate meme'),
    );

    const response = await request(app.getHttpServer())
      .get('/api/memes/daily')
      .set('Authorization', `Bearer ${token}`)
      .expect(502);

    expect((response.body as ErrorResponseBody).message).toBe(
      'Unable to generate meme',
    );
  });

  it('returns 504 when Imgflip times out', async () => {
    const token = await registerAndLogin();
    await onboardUser(token);
    mockExternalDependencies();
    imgflipClient.captionImage.mockRejectedValue(
      new GatewayTimeoutException('Meme generation request timed out'),
    );

    const response = await request(app.getHttpServer())
      .get('/api/memes/daily')
      .set('Authorization', `Bearer ${token}`)
      .expect(504);

    expect((response.body as ErrorResponseBody).statusCode).toBe(504);
  });

  it('returns 503 when Imgflip is rate limited', async () => {
    const token = await registerAndLogin();
    await onboardUser(token);
    mockExternalDependencies();
    imgflipClient.captionImage.mockRejectedValue(
      new ServiceUnavailableException(
        'Meme service is temporarily unavailable',
      ),
    );

    const response = await request(app.getHttpServer())
      .get('/api/memes/daily')
      .set('Authorization', `Bearer ${token}`)
      .expect(503);

    expect((response.body as ErrorResponseBody).statusCode).toBe(503);
  });

  it('returns captions without investment recommendations', async () => {
    const token = await registerAndLogin();
    await onboardUser(token);
    mockExternalDependencies();

    const response = await request(app.getHttpServer())
      .get('/api/memes/daily')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const body = response.body as DailyMemeResponse;
    expect(body.textTop).not.toMatch(/\bbuy\b/i);
    expect(body.textTop).not.toMatch(/\bsell\b/i);
    expect(body.textTop).not.toMatch(/\bhold\b/i);
    expect(body.textBottom).not.toMatch(/investment opportunity/i);
  });
});
