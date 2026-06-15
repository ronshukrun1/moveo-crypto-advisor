import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApplication } from '../src/app.setup';

interface CoinItemResponse {
  id: number;
  coingeckoId: string;
  symbol: string;
  name: string;
}

interface CoinsListResponse {
  items: CoinItemResponse[];
}

const EXPECTED_COINS = [
  { coingeckoId: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
  { coingeckoId: 'cardano', symbol: 'ADA', name: 'Cardano' },
  { coingeckoId: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin' },
  { coingeckoId: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
  { coingeckoId: 'solana', symbol: 'SOL', name: 'Solana' },
  { coingeckoId: 'ripple', symbol: 'XRP', name: 'XRP' },
];

describe('Coins (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApplication(app, app.get(ConfigService));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/coins returns active supported coins without auth', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/coins')
      .expect(200);

    const body = response.body as CoinsListResponse;

    expect(body.items).toHaveLength(6);
    expect(body.items.map((coin) => coin.name)).toEqual(
      EXPECTED_COINS.map((coin) => coin.name),
    );
    expect(body.items.map((coin) => coin.symbol)).toEqual(
      EXPECTED_COINS.map((coin) => coin.symbol),
    );
    expect(body.items.map((coin) => coin.coingeckoId)).toEqual(
      EXPECTED_COINS.map((coin) => coin.coingeckoId),
    );

    for (const coin of body.items) {
      expect(coin.symbol).toBe(coin.symbol.toUpperCase());
      expect(coin).not.toHaveProperty('isActive');
      expect(coin).not.toHaveProperty('createdAt');
      expect(coin).not.toHaveProperty('updatedAt');
    }
  });
});
