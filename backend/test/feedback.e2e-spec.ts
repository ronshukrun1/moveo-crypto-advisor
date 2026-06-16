import { INestApplication } from '@nestjs/common';
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
import { FeedbackContentType } from '../src/feedback/enums/feedback-content-type.enum';
import { FeedbackType } from '../src/feedback/enums/feedback-type.enum';
import { InvestorProfile } from '../src/preferences/enums/investor-profile.enum';

interface LoginResponseBody {
  accessToken: string;
}

interface FeedbackResponseBody {
  contentType: FeedbackContentType;
  contentId: string;
  feedbackType: FeedbackType;
  updatedAt: string;
}

interface FeedbackListResponseBody {
  items: FeedbackResponseBody[];
}

interface DashboardResponseBody {
  market: { items?: Array<{ feedbackContentId?: string }> };
  news: { items?: Array<{ feedbackContentId?: string }> };
  insight: { data?: { feedbackContentId?: string } };
  meme: { data?: { feedbackContentId?: string } };
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

describe('Feedback (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let coinGeckoClient: { fetchMarkets: jest.Mock };
  let newsDataClient: { fetchNews: jest.Mock };
  let openRouterClient: { generateInsightContent: jest.Mock };
  let imgflipClient: { captionImage: jest.Mock };

  beforeAll(async () => {
    coinGeckoClient = { fetchMarkets: jest.fn() };
    newsDataClient = { fetchNews: jest.fn() };
    openRouterClient = { generateInsightContent: jest.fn() };
    imgflipClient = {
      captionImage: jest.fn().mockResolvedValue({
        url: 'https://i.imgflip.com/example.jpg',
        pageUrl: 'https://imgflip.com/i/example',
      }),
    };

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
    await dataSource.query('DELETE FROM feedback');
    await dataSource.query('DELETE FROM daily_insights');
    await dataSource.query('DELETE FROM daily_memes');
    await dataSource.query('DELETE FROM user_selected_coins');
    await dataSource.query('DELETE FROM user_preferences');
    await dataSource.query('DELETE FROM users');
  });

  afterAll(async () => {
    await app.close();
  });

  async function registerAndLogin(email: string): Promise<string> {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        name: 'Feedback User',
        email,
        password: 'StrongPass123!',
      })
      .expect(201);

    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password: 'StrongPass123!' })
      .expect(200);

    return (loginResponse.body as LoginResponseBody).accessToken;
  }

  async function onboardUser(token: string): Promise<void> {
    await request(app.getHttpServer())
      .post('/api/onboarding')
      .set('Authorization', `Bearer ${token}`)
      .send({
        investorProfile: InvestorProfile.LONG_TERM_HOLDER,
        showMarketPrices: true,
        showNews: true,
        showAiInsight: true,
        showMeme: true,
        coinIds: [1, 2],
      })
      .expect(200);
  }

  function mockExternalDependencies(): void {
    coinGeckoClient.fetchMarkets.mockResolvedValue([mockMarketItem]);
    newsDataClient.fetchNews.mockResolvedValue({
      results: [mockArticle],
      nextPage: null,
    });
    openRouterClient.generateInsightContent.mockResolvedValue(validModelJson);
  }

  it('returns 401 without JWT', async () => {
    await request(app.getHttpServer())
      .put('/api/feedback')
      .send({
        contentType: FeedbackContentType.NEWS,
        contentId: 'article-1',
        feedbackType: FeedbackType.UP,
      })
      .expect(401);
  });

  it('creates, reads, and updates feedback for dashboard content', async () => {
    const token = await registerAndLogin('feedback-user@example.com');
    await onboardUser(token);
    mockExternalDependencies();

    const dashboardResponse = await request(app.getHttpServer())
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const dashboard = dashboardResponse.body as DashboardResponseBody;
    const marketContentId = dashboard.market.items?.[0]?.feedbackContentId;
    const newsContentId = dashboard.news.items?.[0]?.feedbackContentId;
    const insightContentId = dashboard.insight.data?.feedbackContentId;
    const memeContentId = dashboard.meme.data?.feedbackContentId;

    expect(marketContentId).toBe('coin:1');
    expect(newsContentId).toBe('article-1');
    expect(insightContentId).toMatch(/^daily-insight:\d+$/);
    expect(memeContentId).toMatch(/^daily-meme:\d+$/);

    const createResponse = await request(app.getHttpServer())
      .put('/api/feedback')
      .set('Authorization', `Bearer ${token}`)
      .send({
        contentType: FeedbackContentType.INSIGHT,
        contentId: insightContentId,
        feedbackType: FeedbackType.UP,
      })
      .expect(200);

    expect(createResponse.body as FeedbackResponseBody).toMatchObject({
      contentType: FeedbackContentType.INSIGHT,
      contentId: insightContentId,
      feedbackType: FeedbackType.UP,
    });

    const readResponse = await request(app.getHttpServer())
      .get('/api/feedback')
      .query({ contentIds: insightContentId })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect((readResponse.body as FeedbackListResponseBody).items).toHaveLength(
      1,
    );

    await request(app.getHttpServer())
      .put('/api/feedback')
      .set('Authorization', `Bearer ${token}`)
      .send({
        contentType: FeedbackContentType.INSIGHT,
        contentId: insightContentId,
        feedbackType: FeedbackType.DOWN,
      })
      .expect(200);

    const rows = await dataSource.query<Array<{ count: number }>>(
      'SELECT COUNT(*)::int AS count FROM feedback WHERE "userId" = (SELECT id FROM users WHERE email = $1)',
      ['feedback-user@example.com'],
    );
    expect(rows[0]?.count).toBe(1);

    const updatedRead = await request(app.getHttpServer())
      .get('/api/feedback')
      .query({ contentIds: insightContentId })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(
      (updatedRead.body as FeedbackListResponseBody).items[0].feedbackType,
    ).toBe(FeedbackType.DOWN);
  });

  it('keeps votes independent per user', async () => {
    const tokenOne = await registerAndLogin('feedback-user-one@example.com');
    await onboardUser(tokenOne);
    mockExternalDependencies();

    const dashboardOne = await request(app.getHttpServer())
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${tokenOne}`)
      .expect(200);
    const insightContentId = (dashboardOne.body as DashboardResponseBody)
      .insight.data?.feedbackContentId;

    await request(app.getHttpServer())
      .put('/api/feedback')
      .set('Authorization', `Bearer ${tokenOne}`)
      .send({
        contentType: FeedbackContentType.INSIGHT,
        contentId: insightContentId,
        feedbackType: FeedbackType.UP,
      })
      .expect(200);

    const tokenTwo = await registerAndLogin('feedback-user-two@example.com');
    await onboardUser(tokenTwo);
    mockExternalDependencies();

    const dashboardTwo = await request(app.getHttpServer())
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${tokenTwo}`)
      .expect(200);
    const insightContentIdTwo = (dashboardTwo.body as DashboardResponseBody)
      .insight.data?.feedbackContentId;

    await request(app.getHttpServer())
      .get('/api/feedback')
      .query({ contentIds: insightContentIdTwo })
      .set('Authorization', `Bearer ${tokenTwo}`)
      .expect(200)
      .expect(({ body }) => {
        expect((body as FeedbackListResponseBody).items).toHaveLength(0);
      });
  });

  it('returns 404 for invalid content targets', async () => {
    const token = await registerAndLogin('feedback-invalid@example.com');
    await onboardUser(token);

    await request(app.getHttpServer())
      .put('/api/feedback')
      .set('Authorization', `Bearer ${token}`)
      .send({
        contentType: FeedbackContentType.INSIGHT,
        contentId: 'daily-insight:999999',
        feedbackType: FeedbackType.UP,
      })
      .expect(404);
  });

  it('rejects unknown fields', async () => {
    const token = await registerAndLogin('feedback-unknown@example.com');
    await onboardUser(token);

    await request(app.getHttpServer())
      .put('/api/feedback')
      .set('Authorization', `Bearer ${token}`)
      .send({
        contentType: FeedbackContentType.NEWS,
        contentId: 'article-1',
        feedbackType: FeedbackType.UP,
        userId: 999,
      })
      .expect(400);
  });
});
