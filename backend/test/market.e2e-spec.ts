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
import { CoinGeckoClient } from '../src/market/coin-gecko.client';
import { clearAppCache } from './utils/clear-app-cache';

interface MarketItemResponse {
  id: string;
  symbol: string;
  name: string;
  imageUrl: string | null;
  currentPrice: number | null;
  marketCap: number | null;
  marketCapRank: number | null;
  totalVolume: number | null;
  high24h: number | null;
  low24h: number | null;
  priceChange24h: number | null;
  changePercentage24h: number | null;
  lastUpdated: string | null;
}

interface MarketListResponse {
  items: MarketItemResponse[];
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

describe('Market (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let coinGeckoClient: { fetchMarkets: jest.Mock };

  const registerPayload = {
    name: 'Ron',
    email: 'market-user@example.com',
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
    coinGeckoClient = {
      fetchMarkets: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(CoinGeckoClient)
      .useValue(coinGeckoClient)
      .compile();

    app = moduleFixture.createNestApplication();
    configureApplication(app, app.get(ConfigService));
    await app.init();

    dataSource = app.get(DataSource);
  });

  beforeEach(async () => {
    coinGeckoClient.fetchMarkets.mockReset();
    await clearAppCache(app);
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

  it('GET /api/market without token returns 401', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/market')
      .expect(401);

    expect((response.body as ErrorResponseBody).statusCode).toBe(401);
  });

  it('returns an empty list when no coins are selected', async () => {
    const token = await registerAndLogin();

    const response = await request(app.getHttpServer())
      .get('/api/market')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect((response.body as MarketListResponse).items).toEqual([]);
    expect(coinGeckoClient.fetchMarkets).not.toHaveBeenCalled();
  });

  it('returns mapped market data for selected coins', async () => {
    const token = await registerAndLogin();

    await request(app.getHttpServer())
      .post('/api/onboarding')
      .set('Authorization', `Bearer ${token}`)
      .send(onboardingPayload)
      .expect(200);

    coinGeckoClient.fetchMarkets.mockResolvedValue([
      mockMarketItem,
      {
        ...mockMarketItem,
        id: 'ethereum',
        symbol: 'eth',
        name: 'Ethereum',
        market_cap_rank: 2,
      },
    ]);

    const response = await request(app.getHttpServer())
      .get('/api/market')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const body = response.body as MarketListResponse;
    expect(coinGeckoClient.fetchMarkets).toHaveBeenCalledWith([
      'bitcoin',
      'ethereum',
    ]);
    expect(body.items).toHaveLength(2);
    expect(body.items[0]).toEqual({
      id: 'bitcoin',
      symbol: 'BTC',
      name: 'Bitcoin',
      imageUrl: mockMarketItem.image,
      currentPrice: mockMarketItem.current_price,
      marketCap: mockMarketItem.market_cap,
      marketCapRank: mockMarketItem.market_cap_rank,
      totalVolume: mockMarketItem.total_volume,
      high24h: mockMarketItem.high_24h,
      low24h: mockMarketItem.low_24h,
      priceChange24h: mockMarketItem.price_change_24h,
      changePercentage24h: mockMarketItem.price_change_percentage_24h,
      lastUpdated: mockMarketItem.last_updated,
    });
    expect(body.items[0]).not.toHaveProperty('current_price');
    expect(body.items[0]).not.toHaveProperty('image');
  });

  it('reuses cached market data on a second identical request', async () => {
    const token = await registerAndLogin();

    await request(app.getHttpServer())
      .post('/api/onboarding')
      .set('Authorization', `Bearer ${token}`)
      .send(onboardingPayload)
      .expect(200);

    coinGeckoClient.fetchMarkets.mockResolvedValue([
      mockMarketItem,
      {
        ...mockMarketItem,
        id: 'ethereum',
        symbol: 'eth',
        name: 'Ethereum',
        market_cap_rank: 2,
      },
    ]);

    const firstResponse = await request(app.getHttpServer())
      .get('/api/market')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    coinGeckoClient.fetchMarkets.mockClear();

    const secondResponse = await request(app.getHttpServer())
      .get('/api/market')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(secondResponse.body).toEqual(firstResponse.body);
    expect(coinGeckoClient.fetchMarkets).not.toHaveBeenCalled();
    expect(JSON.stringify(secondResponse.body)).not.toContain('cache');
  });

  it('calls CoinGecko again when selected coins change', async () => {
    const token = await registerAndLogin();

    await request(app.getHttpServer())
      .post('/api/onboarding')
      .set('Authorization', `Bearer ${token}`)
      .send(onboardingPayload)
      .expect(200);

    coinGeckoClient.fetchMarkets.mockResolvedValue([mockMarketItem]);

    await request(app.getHttpServer())
      .get('/api/market')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    await request(app.getHttpServer())
      .put('/api/selected-coins')
      .set('Authorization', `Bearer ${token}`)
      .send({ coinIds: [1] })
      .expect(200);

    coinGeckoClient.fetchMarkets.mockClear();
    await request(app.getHttpServer())
      .get('/api/market')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(coinGeckoClient.fetchMarkets).toHaveBeenCalledTimes(1);
    expect(coinGeckoClient.fetchMarkets).toHaveBeenCalledWith(['bitcoin']);
  });

  it('does not expose raw CoinGecko fields or API keys in responses', async () => {
    const token = await registerAndLogin();

    await request(app.getHttpServer())
      .post('/api/onboarding')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...onboardingPayload, coinIds: [1] })
      .expect(200);

    coinGeckoClient.fetchMarkets.mockResolvedValue([mockMarketItem]);

    const response = await request(app.getHttpServer())
      .get('/api/market')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const body = response.body as MarketListResponse;
    expect(body.items[0]).not.toHaveProperty('price_change_24h');
    expect(JSON.stringify(body)).not.toContain('test-coingecko-api-key');
  });

  it('returns 504 when the upstream request times out', async () => {
    const token = await registerAndLogin();

    await request(app.getHttpServer())
      .post('/api/onboarding')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...onboardingPayload, coinIds: [1] })
      .expect(200);

    coinGeckoClient.fetchMarkets.mockRejectedValue(
      new GatewayTimeoutException('Market data provider request timed out'),
    );

    const response = await request(app.getHttpServer())
      .get('/api/market')
      .set('Authorization', `Bearer ${token}`)
      .expect(504);

    expect((response.body as ErrorResponseBody).statusCode).toBe(504);
    expect((response.body as ErrorResponseBody).message).toBe(
      'Market data provider request timed out',
    );
  });

  it('returns 502 for malformed upstream responses', async () => {
    const token = await registerAndLogin();

    await request(app.getHttpServer())
      .post('/api/onboarding')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...onboardingPayload, coinIds: [1] })
      .expect(200);

    coinGeckoClient.fetchMarkets.mockRejectedValue(
      new BadGatewayException('Invalid market data received from provider'),
    );

    const response = await request(app.getHttpServer())
      .get('/api/market')
      .set('Authorization', `Bearer ${token}`)
      .expect(502);

    expect((response.body as ErrorResponseBody).statusCode).toBe(502);
  });

  it('does not invent market data for missing requested coins', async () => {
    const token = await registerAndLogin();

    await request(app.getHttpServer())
      .post('/api/onboarding')
      .set('Authorization', `Bearer ${token}`)
      .send(onboardingPayload)
      .expect(200);

    coinGeckoClient.fetchMarkets.mockResolvedValue([mockMarketItem]);

    const response = await request(app.getHttpServer())
      .get('/api/market')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect((response.body as MarketListResponse).items).toHaveLength(1);
    expect((response.body as MarketListResponse).items[0].id).toBe('bitcoin');
  });
});
