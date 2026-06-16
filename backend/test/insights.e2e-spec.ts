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
import { NewsDataClient } from '../src/news/news-data.client';
import { OpenRouterClient } from '../src/insights/open-router.client';
import { InvestorProfile } from '../src/preferences/enums/investor-profile.enum';
import { INSIGHT_DISCLAIMER } from '../src/insights/constants/insight.constants';

interface DailyInsightResponse {
  title: string;
  insight: string;
  disclaimer: string;
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

const mockArticle = {
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

const validModelJson =
  '{"title":"Bitcoin and Ethereum Update","insight":"Bitcoin rose 2.2% during the last 24 hours. Ethereum also moved higher while recent headlines reflected ongoing network and market activity."}';

describe('Insights (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let coinGeckoClient: { fetchMarkets: jest.Mock };
  let newsDataClient: { fetchNews: jest.Mock };
  let openRouterClient: { generateInsightContent: jest.Mock };

  const registerPayload = {
    name: 'Ron',
    email: 'insights-user@example.com',
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
    newsDataClient = { fetchNews: jest.fn() };
    openRouterClient = { generateInsightContent: jest.fn() };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(CoinGeckoClient)
      .useValue(coinGeckoClient)
      .overrideProvider(NewsDataClient)
      .useValue(newsDataClient)
      .overrideProvider(OpenRouterClient)
      .useValue(openRouterClient)
      .compile();

    app = moduleFixture.createNestApplication();
    configureApplication(app, app.get(ConfigService));
    await app.init();

    dataSource = app.get(DataSource);
  });

  beforeEach(async () => {
    coinGeckoClient.fetchMarkets.mockReset();
    newsDataClient.fetchNews.mockReset();
    openRouterClient.generateInsightContent.mockReset();

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
      },
    ]);
    newsDataClient.fetchNews.mockResolvedValue({
      status: 'success',
      totalResults: 1,
      results: [mockArticle],
      nextPage: null,
    });
    openRouterClient.generateInsightContent.mockResolvedValue(validModelJson);
  }

  it('GET /api/insights/daily without token returns 401', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/insights/daily')
      .expect(401);

    expect((response.body as ErrorResponseBody).statusCode).toBe(401);
  });

  it('returns 400 when the user has no selected coins', async () => {
    const token = await registerAndLogin();

    const response = await request(app.getHttpServer())
      .get('/api/insights/daily')
      .set('Authorization', `Bearer ${token}`)
      .expect(400);

    expect((response.body as ErrorResponseBody).message).toBe(
      'Select at least one coin before generating an insight',
    );
    expect(openRouterClient.generateInsightContent).not.toHaveBeenCalled();
  });

  it('returns a mapped insight for an authenticated onboarded user', async () => {
    const token = await registerAndLogin();
    await onboardUser(token);
    mockExternalDependencies();

    const response = await request(app.getHttpServer())
      .get('/api/insights/daily')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const body = response.body as DailyInsightResponse;
    expect(body.title).toBe('Bitcoin and Ethereum Update');
    expect(body.insight).toContain('Bitcoin rose 2.2%');
    expect(body.disclaimer).toBe(INSIGHT_DISCLAIMER);
    expect(body.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(openRouterClient.generateInsightContent).toHaveBeenCalled();
  });

  it('does not expose reasoning, usage, provider, or raw prompt data', async () => {
    const token = await registerAndLogin();
    await onboardUser(token);
    mockExternalDependencies();

    const response = await request(app.getHttpServer())
      .get('/api/insights/daily')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const serialized = JSON.stringify(response.body);
    expect(serialized).not.toContain('reasoning');
    expect(serialized).not.toContain('usage');
    expect(serialized).not.toContain('provider');
    expect(serialized).not.toContain('test-openrouter-api-key');
    expect(serialized).not.toContain('System prompt');
  });

  it('rejects unknown query fields such as userId', async () => {
    const token = await registerAndLogin();

    const response = await request(app.getHttpServer())
      .get('/api/insights/daily?userId=999')
      .set('Authorization', `Bearer ${token}`)
      .expect(400);

    expect((response.body as ErrorResponseBody).statusCode).toBe(400);
  });

  it('returns 502 for invalid model JSON', async () => {
    const token = await registerAndLogin();
    await onboardUser(token);
    mockExternalDependencies();
    openRouterClient.generateInsightContent.mockResolvedValue('not-json');

    const response = await request(app.getHttpServer())
      .get('/api/insights/daily')
      .set('Authorization', `Bearer ${token}`)
      .expect(502);

    expect((response.body as ErrorResponseBody).statusCode).toBe(502);
  });

  it('returns 502 for null model content', async () => {
    const token = await registerAndLogin();
    await onboardUser(token);
    mockExternalDependencies();
    openRouterClient.generateInsightContent.mockRejectedValue(
      new BadGatewayException('Unable to generate insight'),
    );

    const response = await request(app.getHttpServer())
      .get('/api/insights/daily')
      .set('Authorization', `Bearer ${token}`)
      .expect(502);

    expect((response.body as ErrorResponseBody).statusCode).toBe(502);
  });

  it('returns 502 when recommendation content is returned', async () => {
    const token = await registerAndLogin();
    await onboardUser(token);
    mockExternalDependencies();
    openRouterClient.generateInsightContent.mockResolvedValue(
      '{"title":"Market note","insight":"This may be a good time to invest in Bitcoin. Prices moved higher during the last day."}',
    );

    const response = await request(app.getHttpServer())
      .get('/api/insights/daily')
      .set('Authorization', `Bearer ${token}`)
      .expect(502);

    expect((response.body as ErrorResponseBody).statusCode).toBe(502);
  });

  it('returns 504 when OpenRouter times out', async () => {
    const token = await registerAndLogin();
    await onboardUser(token);
    mockExternalDependencies();
    openRouterClient.generateInsightContent.mockRejectedValue(
      new GatewayTimeoutException('AI insight request timed out'),
    );

    const response = await request(app.getHttpServer())
      .get('/api/insights/daily')
      .set('Authorization', `Bearer ${token}`)
      .expect(504);

    expect((response.body as ErrorResponseBody).statusCode).toBe(504);
  });

  it('returns 503 when OpenRouter is rate limited', async () => {
    const token = await registerAndLogin();
    await onboardUser(token);
    mockExternalDependencies();
    openRouterClient.generateInsightContent.mockRejectedValue(
      new ServiceUnavailableException(
        'AI insight service is temporarily unavailable',
      ),
    );

    const response = await request(app.getHttpServer())
      .get('/api/insights/daily')
      .set('Authorization', `Bearer ${token}`)
      .expect(503);

    expect((response.body as ErrorResponseBody).statusCode).toBe(503);
  });
});
