import {
  BadGatewayException,
  GatewayTimeoutException,
  INestApplication,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { configureApplication } from '../src/app.setup';
import { InvestorProfile } from '../src/preferences/enums/investor-profile.enum';
import { NewsDataClient } from '../src/news/news-data.client';

interface NewsItemResponse {
  id: string;
  title: string;
  description: string | null;
  url: string;
  imageUrl: string | null;
  sourceName: string | null;
  sourceUrl: string | null;
  creator: string[] | null;
  relatedCoins: string[] | null;
  publishedAt: string | null;
}

interface NewsListResponse {
  items: NewsItemResponse[];
  nextPage: string | null;
}

interface LoginResponseBody {
  accessToken: string;
}

interface ErrorResponseBody {
  statusCode: number;
  message: string;
}

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

describe('News (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let newsDataClient: { fetchNews: jest.Mock };

  const registerPayload = {
    name: 'Ron',
    email: 'news-user@example.com',
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
    newsDataClient = {
      fetchNews: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(NewsDataClient)
      .useValue(newsDataClient)
      .compile();

    app = moduleFixture.createNestApplication();
    configureApplication(app, app.get(ConfigService));
    await app.init();

    dataSource = app.get(DataSource);
  });

  beforeEach(async () => {
    newsDataClient.fetchNews.mockReset();
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

  it('GET /api/news without token returns 401', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/news')
      .expect(401);

    expect((response.body as ErrorResponseBody).statusCode).toBe(401);
  });

  it('returns an empty list when no coins are selected', async () => {
    const token = await registerAndLogin();

    const response = await request(app.getHttpServer())
      .get('/api/news')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect((response.body as NewsListResponse).items).toEqual([]);
    expect((response.body as NewsListResponse).nextPage).toBeNull();
    expect(newsDataClient.fetchNews).not.toHaveBeenCalled();
  });

  it('returns mapped mocked news for selected coins', async () => {
    const token = await registerAndLogin();

    await request(app.getHttpServer())
      .post('/api/onboarding')
      .set('Authorization', `Bearer ${token}`)
      .send(onboardingPayload)
      .expect(200);

    newsDataClient.fetchNews.mockResolvedValue({
      status: 'success',
      totalResults: 1,
      results: [mockArticle],
      nextPage: 'next-token',
    });

    const response = await request(app.getHttpServer())
      .get('/api/news')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const body = response.body as NewsListResponse;
    expect(newsDataClient.fetchNews).toHaveBeenCalledWith({
      symbols: ['BTC', 'ETH'],
      limit: 5,
      page: undefined,
    });
    expect(body.items).toHaveLength(1);
    expect(body.items[0].imageUrl).toBe(mockArticle.image_url);
    expect(body.nextPage).toBe('next-token');
  });

  it('rejects invalid limit values with 400', async () => {
    const token = await registerAndLogin();

    const response = await request(app.getHttpServer())
      .get('/api/news?limit=11')
      .set('Authorization', `Bearer ${token}`)
      .expect(400);

    expect((response.body as ErrorResponseBody).statusCode).toBe(400);
  });

  it('rejects unknown query fields with 400', async () => {
    const token = await registerAndLogin();

    const response = await request(app.getHttpServer())
      .get('/api/news?userId=999')
      .set('Authorization', `Bearer ${token}`)
      .expect(400);

    expect((response.body as ErrorResponseBody).statusCode).toBe(400);
  });

  it('removes duplicate articles and returns null for missing images', async () => {
    const token = await registerAndLogin();

    await request(app.getHttpServer())
      .post('/api/onboarding')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...onboardingPayload, coinIds: [1] })
      .expect(200);

    newsDataClient.fetchNews.mockResolvedValue({
      status: 'success',
      totalResults: 2,
      results: [
        mockArticle,
        { ...mockArticle, title: 'Duplicate article' },
        {
          ...mockArticle,
          article_id: 'article-2',
          link: 'https://example.com/article-2',
          image_url: null,
        },
      ],
      nextPage: null,
    });

    const response = await request(app.getHttpServer())
      .get('/api/news')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const body = response.body as NewsListResponse;
    expect(body.items).toHaveLength(2);
    expect(body.items[1].imageUrl).toBeNull();
  });

  it('does not expose raw external fields or API keys', async () => {
    const token = await registerAndLogin();

    await request(app.getHttpServer())
      .post('/api/onboarding')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...onboardingPayload, coinIds: [1] })
      .expect(200);

    newsDataClient.fetchNews.mockResolvedValue({
      status: 'success',
      totalResults: 1,
      results: [mockArticle],
      nextPage: null,
    });

    const response = await request(app.getHttpServer())
      .get('/api/news')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const body = response.body as NewsListResponse;
    expect(body.items[0]).not.toHaveProperty('article_id');
    expect(body.items[0]).not.toHaveProperty('image_url');
    expect(JSON.stringify(body)).not.toContain('test-newsdata-api-key');
  });

  it('returns 504 when the upstream request times out', async () => {
    const token = await registerAndLogin();

    await request(app.getHttpServer())
      .post('/api/onboarding')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...onboardingPayload, coinIds: [1] })
      .expect(200);

    newsDataClient.fetchNews.mockRejectedValue(
      new GatewayTimeoutException('News request timed out'),
    );

    const response = await request(app.getHttpServer())
      .get('/api/news')
      .set('Authorization', `Bearer ${token}`)
      .expect(504);

    expect((response.body as ErrorResponseBody).statusCode).toBe(504);
  });

  it('returns 502 for malformed upstream responses', async () => {
    const token = await registerAndLogin();

    await request(app.getHttpServer())
      .post('/api/onboarding')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...onboardingPayload, coinIds: [1] })
      .expect(200);

    newsDataClient.fetchNews.mockRejectedValue(
      new BadGatewayException('Unable to retrieve news'),
    );

    const response = await request(app.getHttpServer())
      .get('/api/news')
      .set('Authorization', `Bearer ${token}`)
      .expect(502);

    expect((response.body as ErrorResponseBody).statusCode).toBe(502);
  });
});
