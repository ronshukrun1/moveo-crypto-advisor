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
import { ImgflipClient } from '../src/memes/imgflip.client';
import { InvestorProfile } from '../src/preferences/enums/investor-profile.enum';

interface DashboardUserResponse {
  id: number;
  name: string;
  onboardingCompleted: boolean;
}

interface DashboardPreferencesResponse {
  investorProfile: InvestorProfile;
  showMarketPrices: boolean;
  showNews: boolean;
  showAiInsight: boolean;
  showMeme: boolean;
}

interface DashboardResponse {
  user: DashboardUserResponse;
  preferences: DashboardPreferencesResponse;
  selectedCoins: Array<{
    id: number;
    coingeckoId: string;
    symbol: string;
    name: string;
  }>;
  market: { status: string; items?: unknown[]; message?: string };
  news: {
    status: string;
    items?: unknown[];
    nextPage?: string | null;
    message?: string;
  };
  insight: { status: string; data?: Record<string, unknown>; message?: string };
  meme: { status: string; data?: Record<string, unknown>; message?: string };
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

describe('Dashboard (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let coinGeckoClient: { fetchMarkets: jest.Mock };
  let newsDataClient: { fetchNews: jest.Mock };
  let openRouterClient: { generateInsightContent: jest.Mock };
  let imgflipClient: { captionImage: jest.Mock };

  const registerPayload = {
    name: 'Ron',
    email: 'dashboard-user@example.com',
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
    imgflipClient = { captionImage: jest.fn() };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(CoinGeckoClient)
      .useValue(coinGeckoClient)
      .overrideProvider(NewsDataClient)
      .useValue(newsDataClient)
      .overrideProvider(OpenRouterClient)
      .useValue(openRouterClient)
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
    newsDataClient.fetchNews.mockReset();
    openRouterClient.generateInsightContent.mockReset();
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
    newsDataClient.fetchNews.mockResolvedValue({
      status: 'success',
      totalResults: 1,
      results: [mockArticle],
      nextPage: null,
    });
    openRouterClient.generateInsightContent.mockResolvedValue(validModelJson);
    imgflipClient.captionImage.mockResolvedValue({
      url: 'https://i.imgflip.com/example.jpg',
      pageUrl: 'https://imgflip.com/i/example',
    });
  }

  it('GET /api/dashboard without token returns 401', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/dashboard')
      .expect(401);

    expect((response.body as ErrorResponseBody).statusCode).toBe(401);
  });

  it('returns 409 when onboarding is incomplete', async () => {
    const token = await registerAndLogin();

    const response = await request(app.getHttpServer())
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${token}`)
      .expect(409);

    expect((response.body as ErrorResponseBody).message).toBe(
      'Complete onboarding before accessing the dashboard',
    );
  });

  it('returns a full dashboard for a completed user with mocked services', async () => {
    const token = await registerAndLogin();
    await onboardUser(token);
    mockExternalDependencies();

    const response = await request(app.getHttpServer())
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const body = response.body as DashboardResponse;
    expect(body.user).toEqual({
      id: expect.any(Number) as number,
      name: 'Ron',
      onboardingCompleted: true,
    });
    expect(body.preferences.investorProfile).toBe(
      InvestorProfile.LONG_TERM_HOLDER,
    );
    expect(body.selectedCoins).toHaveLength(2);
    expect(body.market.status).toBe('available');
    expect(body.news.status).toBe('available');
    expect(body.insight.status).toBe('available');
    expect(body.meme.status).toBe('available');
    expect(body.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('calls CoinGecko once when market, insight, and meme are enabled', async () => {
    const token = await registerAndLogin();
    await onboardUser(token);
    mockExternalDependencies();

    await request(app.getHttpServer())
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(coinGeckoClient.fetchMarkets).toHaveBeenCalledTimes(1);
  });

  it('calls NewsData once when news and insight are enabled', async () => {
    const token = await registerAndLogin();
    await onboardUser(token);
    mockExternalDependencies();

    await request(app.getHttpServer())
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(newsDataClient.fetchNews).toHaveBeenCalledTimes(1);
  });

  it('loads shared market data for insight while keeping market disabled', async () => {
    const token = await registerAndLogin();
    await request(app.getHttpServer())
      .post('/api/onboarding')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ...onboardingPayload,
        showMarketPrices: false,
        showNews: false,
        showAiInsight: true,
        showMeme: false,
      })
      .expect(200);
    mockExternalDependencies();

    const response = await request(app.getHttpServer())
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const body = response.body as DashboardResponse;
    expect(coinGeckoClient.fetchMarkets).toHaveBeenCalledTimes(1);
    expect(newsDataClient.fetchNews).toHaveBeenCalledTimes(1);
    expect(body.market).toEqual({ status: 'disabled' });
    expect(body.news).toEqual({ status: 'disabled' });
    expect(body.insight.status).toBe('available');
  });

  it('does not call disabled section services', async () => {
    const token = await registerAndLogin();
    await request(app.getHttpServer())
      .post('/api/onboarding')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ...onboardingPayload,
        showMarketPrices: false,
        showNews: false,
        showAiInsight: false,
        showMeme: false,
      })
      .expect(200);

    const response = await request(app.getHttpServer())
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const body = response.body as DashboardResponse;
    expect(body.market).toEqual({ status: 'disabled' });
    expect(body.news).toEqual({ status: 'disabled' });
    expect(body.insight).toEqual({ status: 'disabled' });
    expect(body.meme).toEqual({ status: 'disabled' });
    expect(coinGeckoClient.fetchMarkets).not.toHaveBeenCalled();
    expect(newsDataClient.fetchNews).not.toHaveBeenCalled();
    expect(openRouterClient.generateInsightContent).not.toHaveBeenCalled();
    expect(imgflipClient.captionImage).not.toHaveBeenCalled();
  });

  it('returns 200 with unavailable market when CoinGecko fails', async () => {
    const token = await registerAndLogin();
    await onboardUser(token);
    mockExternalDependencies();
    coinGeckoClient.fetchMarkets.mockRejectedValue(
      new GatewayTimeoutException('Market data provider request timed out'),
    );

    const response = await request(app.getHttpServer())
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const body = response.body as DashboardResponse;
    expect(body.market).toEqual({
      status: 'unavailable',
      message: 'Market data is temporarily unavailable',
    });
    expect(body.news.status).toBe('available');
    expect(body.insight.status).toBe('unavailable');
    expect(body.meme.status).toBe('unavailable');
  });

  it('returns 200 with multiple unavailable sections while preserving others', async () => {
    const token = await registerAndLogin();
    await onboardUser(token);
    mockExternalDependencies();
    newsDataClient.fetchNews.mockRejectedValue(
      new BadGatewayException('Unable to retrieve news'),
    );
    openRouterClient.generateInsightContent.mockRejectedValue(
      new ServiceUnavailableException(
        'AI insight service is temporarily unavailable',
      ),
    );

    const response = await request(app.getHttpServer())
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const body = response.body as DashboardResponse;
    expect(body.news.status).toBe('unavailable');
    expect(body.insight.status).toBe('unavailable');
    expect(body.market.status).toBe('available');
    expect(body.meme.status).toBe('available');
    expect(body.user.name).toBe('Ron');
  });

  it('rejects unknown query fields such as userId', async () => {
    const token = await registerAndLogin();
    await onboardUser(token);

    const response = await request(app.getHttpServer())
      .get('/api/dashboard?userId=999')
      .set('Authorization', `Bearer ${token}`)
      .expect(400);

    expect((response.body as ErrorResponseBody).statusCode).toBe(400);
  });

  it('does not expose sensitive or raw provider fields', async () => {
    const token = await registerAndLogin();
    await onboardUser(token);
    mockExternalDependencies();

    const response = await request(app.getHttpServer())
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const serialized = JSON.stringify(response.body);
    expect(serialized).not.toContain('passwordHash');
    expect(serialized).not.toContain('test-openrouter-api-key');
    expect(serialized).not.toContain('test-imgflip-password');
    expect(serialized).not.toContain('article_id');
    expect(serialized).not.toContain('reasoning');
    expect(serialized).not.toContain('usage');
    expect((response.body as DashboardResponse).user).not.toHaveProperty(
      'email',
    );
  });

  it('standalone insight and meme endpoints still work independently', async () => {
    const token = await registerAndLogin();
    await onboardUser(token);
    mockExternalDependencies();

    await request(app.getHttpServer())
      .get('/api/insights/daily')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    await request(app.getHttpServer())
      .get('/api/memes/daily')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(
      coinGeckoClient.fetchMarkets.mock.calls.length,
    ).toBeGreaterThanOrEqual(2);
    expect(newsDataClient.fetchNews.mock.calls.length).toBeGreaterThanOrEqual(
      1,
    );
  });
});
