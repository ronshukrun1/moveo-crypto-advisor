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
import * as dailyContentUtils from '../src/common/utils/daily-content.utils';
import {
  parseImgflipTemplateIds,
  buildTemplatePoolVersion,
} from '../src/config/imgflip-template-ids.utils';
import { CoinGeckoClient } from '../src/market/coin-gecko.client';
import { DailyMeme } from '../src/memes/entities/daily-meme.entity';
import { ImgflipClient } from '../src/memes/imgflip.client';
import {
  getEligibleCaptionVariationIds,
  getMovementCategory,
  selectMostVolatileMarketItem,
} from '../src/memes/utils/meme-caption.builder';
import { buildCaptionsForSnapshot } from '../src/memes/utils/meme-snapshot.builder';
import { selectMemeVariation } from '../src/memes/utils/meme-variation.utils';
import { InvestorProfile } from '../src/preferences/enums/investor-profile.enum';
import { User } from '../src/users/entities/user.entity';

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

const onboardingPayload = {
  investorProfile: InvestorProfile.LONG_TERM_HOLDER,
  showMarketPrices: true,
  showNews: true,
  showAiInsight: true,
  showMeme: true,
  coinIds: [1, 2],
};

function getTemplateIds(): number[] {
  return parseImgflipTemplateIds(process.env.IMGFLIP_TEMPLATE_IDS ?? '');
}

function buildExpectedVariation(userId: number, generatedForDate: string) {
  const templateIds = getTemplateIds();
  const marketItems = [
    {
      symbol: 'BTC',
      name: 'Bitcoin',
      changePercentage24h: 2.17,
    },
    {
      symbol: 'ETH',
      name: 'Ethereum',
      changePercentage24h: -5.1,
    },
  ];
  const movement = getMovementCategory(
    selectMostVolatileMarketItem(marketItems).changePercentage24h,
  );
  const eligibleCaptionVariationIds = getEligibleCaptionVariationIds(
    movement,
    onboardingPayload.investorProfile,
  );
  const variation = selectMemeVariation({
    userId,
    generatedForDate,
    investorProfile: onboardingPayload.investorProfile,
    selectedCoinIds: onboardingPayload.coinIds,
    templateIds,
    eligibleCaptionVariationIds,
    previousDayMeme: null,
  });
  const captions = buildCaptionsForSnapshot(
    {
      userId,
      investorProfile: onboardingPayload.investorProfile,
      generatedForDate,
      selectedCoins: [
        { id: 1, symbol: 'BTC', name: 'Bitcoin' },
        { id: 2, symbol: 'ETH', name: 'Ethereum' },
      ],
      marketItems,
    },
    variation.captionVariationId,
  );

  return { variation, captions };
}

describe('Memes (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let coinGeckoClient: { fetchMarkets: jest.Mock };
  let imgflipClient: { captionImage: jest.Mock };
  let currentUtcDate = '2026-06-16';

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
    currentUtcDate = '2026-06-16';
    jest
      .spyOn(dailyContentUtils, 'getUtcDateString')
      .mockImplementation(() => currentUtcDate);

    coinGeckoClient.fetchMarkets.mockReset();
    imgflipClient.captionImage.mockReset();

    await dataSource.query('DELETE FROM daily_insights');
    await dataSource.query('DELETE FROM daily_memes');
    await dataSource.query('DELETE FROM user_selected_coins');
    await dataSource.query('DELETE FROM user_preferences');
    await dataSource.query('DELETE FROM users');
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await app.close();
  });

  async function registerAndLogin(
    email: string,
    name: string,
  ): Promise<string> {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        name,
        email,
        password: 'StrongPass123!',
      })
      .expect(201);

    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email,
        password: 'StrongPass123!',
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
    imgflipClient.captionImage.mockImplementation(
      (params: { templateId: number; text0: string; text1: string }) => ({
        url: `https://i.imgflip.com/${params.templateId}.jpg`,
        pageUrl: `https://imgflip.com/i/${params.templateId}`,
      }),
    );
  }

  it('GET /api/memes/daily without token returns 401', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/memes/daily')
      .expect(401);

    expect((response.body as ErrorResponseBody).statusCode).toBe(401);
  });

  it('returns 400 when the user has no selected coins', async () => {
    const token = await registerAndLogin('memes-user@example.com', 'Ron');

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
    const token = await registerAndLogin('memes-user@example.com', 'Ron');
    await onboardUser(token);
    mockExternalDependencies();

    const user = await dataSource.getRepository(User).findOneByOrFail({
      email: 'memes-user@example.com',
    });
    const { variation, captions } = buildExpectedVariation(
      user.id,
      currentUtcDate,
    );

    const response = await request(app.getHttpServer())
      .get('/api/memes/daily')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const body = response.body as DailyMemeResponse;
    expect(body.imageUrl).toBe(
      `https://i.imgflip.com/${variation.templateId}.jpg`,
    );
    expect(body.pageUrl).toBe(`https://imgflip.com/i/${variation.templateId}`);
    expect(body.textTop).toBe(captions.textTop);
    expect(body.textBottom).toBe(captions.textBottom);
    expect(body.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(imgflipClient.captionImage).toHaveBeenCalledWith({
      templateId: variation.templateId,
      text0: captions.textTop,
      text1: captions.textBottom,
    });
  });

  it('returns the same stored meme on a second same-day request', async () => {
    const token = await registerAndLogin('memes-user@example.com', 'Ron');
    await onboardUser(token);
    mockExternalDependencies();

    const firstResponse = await request(app.getHttpServer())
      .get('/api/memes/daily')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    imgflipClient.captionImage.mockClear();
    coinGeckoClient.fetchMarkets.mockClear();

    const secondResponse = await request(app.getHttpServer())
      .get('/api/memes/daily')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(secondResponse.body).toEqual(firstResponse.body);
    expect(imgflipClient.captionImage).not.toHaveBeenCalled();
    expect(coinGeckoClient.fetchMarkets).not.toHaveBeenCalled();
    expect(await dataSource.getRepository(DailyMeme).count()).toBe(1);
  });

  it('creates separate daily meme rows for two users with identical selected coins', async () => {
    const tokenA = await registerAndLogin('meme-user-a@example.com', 'User A');
    const tokenB = await registerAndLogin('meme-user-b@example.com', 'User B');
    await onboardUser(tokenA);
    await onboardUser(tokenB);
    mockExternalDependencies();

    await request(app.getHttpServer())
      .get('/api/memes/daily')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);
    await request(app.getHttpServer())
      .get('/api/memes/daily')
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(200);

    const rows = await dataSource.getRepository(DailyMeme).find();
    expect(rows).toHaveLength(2);
    expect(
      rows[0].templateId !== rows[1].templateId ||
        rows[0].textTop !== rows[1].textTop ||
        rows[0].textBottom !== rows[1].textBottom,
    ).toBe(true);
  });

  it('returns a new daily meme on the next UTC date', async () => {
    const token = await registerAndLogin('memes-user@example.com', 'Ron');
    await onboardUser(token);
    mockExternalDependencies();

    const firstResponse = await request(app.getHttpServer())
      .get('/api/memes/daily')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    currentUtcDate = '2026-06-17';
    imgflipClient.captionImage.mockClear();

    const secondResponse = await request(app.getHttpServer())
      .get('/api/memes/daily')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(secondResponse.body).not.toEqual(firstResponse.body);
    expect(imgflipClient.captionImage).toHaveBeenCalledTimes(1);
    expect(await dataSource.getRepository(DailyMeme).count()).toBe(2);
  });

  it('regenerates today meme when selected coins change', async () => {
    const token = await registerAndLogin('memes-user@example.com', 'Ron');
    await onboardUser(token);
    mockExternalDependencies();

    const firstResponse = await request(app.getHttpServer())
      .get('/api/memes/daily')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    await request(app.getHttpServer())
      .put('/api/selected-coins')
      .set('Authorization', `Bearer ${token}`)
      .send({ coinIds: [1] })
      .expect(200);

    imgflipClient.captionImage.mockClear();

    const secondResponse = await request(app.getHttpServer())
      .get('/api/memes/daily')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(secondResponse.body).not.toEqual(firstResponse.body);
    expect(imgflipClient.captionImage).toHaveBeenCalledTimes(1);
  });

  it('regenerates today meme when investor profile changes', async () => {
    const token = await registerAndLogin('memes-user@example.com', 'Ron');
    await onboardUser(token);
    mockExternalDependencies();

    const firstResponse = await request(app.getHttpServer())
      .get('/api/memes/daily')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    await request(app.getHttpServer())
      .patch('/api/preferences')
      .set('Authorization', `Bearer ${token}`)
      .send({ investorProfile: InvestorProfile.BEGINNER })
      .expect(200);

    imgflipClient.captionImage.mockClear();

    const secondResponse = await request(app.getHttpServer())
      .get('/api/memes/daily')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(secondResponse.body).not.toEqual(firstResponse.body);
    expect(imgflipClient.captionImage).toHaveBeenCalledTimes(1);
  });

  it('does not expose credentials, hashes, or template pool metadata', async () => {
    const token = await registerAndLogin('memes-user@example.com', 'Ron');
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
    expect(serialized).not.toContain('sourceDataSnapshot');
    expect(serialized).not.toContain('contextHash');
    expect(serialized).not.toContain('captionVariationId');
    expect(serialized).not.toContain('templateId');
    expect(serialized).not.toContain(
      buildTemplatePoolVersion(getTemplateIds()),
    );
  });

  it('rejects unknown query fields such as userId', async () => {
    const token = await registerAndLogin('memes-user@example.com', 'Ron');

    const response = await request(app.getHttpServer())
      .get('/api/memes/daily?userId=999')
      .set('Authorization', `Bearer ${token}`)
      .expect(400);

    expect((response.body as ErrorResponseBody).statusCode).toBe(400);
  });

  it('returns 502 when Imgflip reports success=false', async () => {
    const token = await registerAndLogin('memes-user@example.com', 'Ron');
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

  it('returns 504 when Imgflip times out', async () => {
    const token = await registerAndLogin('memes-user@example.com', 'Ron');
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
    const token = await registerAndLogin('memes-user@example.com', 'Ron');
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
    const token = await registerAndLogin('memes-user@example.com', 'Ron');
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
