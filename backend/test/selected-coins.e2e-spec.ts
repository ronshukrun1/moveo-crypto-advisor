import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { configureApplication } from '../src/app.setup';

interface CoinItemResponse {
  id: number;
  coingeckoId: string;
  symbol: string;
  name: string;
}

interface SelectedCoinsListResponse {
  items: CoinItemResponse[];
}

interface ReplaceSelectedCoinsResponse {
  message: string;
  items: CoinItemResponse[];
}

interface LoginResponseBody {
  accessToken: string;
}

interface ErrorResponseBody {
  statusCode: number;
  message: string | string[];
  details?: string[];
}

describe('Selected Coins (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;

  const firstUser = {
    name: 'Ron',
    email: 'selected-coins-user@example.com',
    password: 'StrongPass123!',
  };

  const secondUser = {
    name: 'Alex',
    email: 'selected-coins-user-2@example.com',
    password: 'StrongPass123!',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApplication(app, app.get(ConfigService));
    await app.init();

    dataSource = app.get(DataSource);
  });

  beforeEach(async () => {
    await dataSource.query('DELETE FROM user_selected_coins');
    await dataSource.query('DELETE FROM user_preferences');
    await dataSource.query('DELETE FROM users');
    await dataSource.query('UPDATE coins SET "isActive" = true');
  });

  afterAll(async () => {
    await app.close();
  });

  async function registerAndLogin(user: {
    name: string;
    email: string;
    password: string;
  }): Promise<string> {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(user)
      .expect(201);

    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: user.email,
        password: user.password,
      })
      .expect(200);

    return (loginResponse.body as LoginResponseBody).accessToken;
  }

  it('GET /api/selected-coins without token returns 401', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/selected-coins')
      .expect(401);

    expect((response.body as ErrorResponseBody).statusCode).toBe(401);
  });

  it('returns an empty list when no selections exist', async () => {
    const token = await registerAndLogin(firstUser);

    const response = await request(app.getHttpServer())
      .get('/api/selected-coins')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect((response.body as SelectedCoinsListResponse).items).toEqual([]);
  });

  it('saves and returns valid selections', async () => {
    const token = await registerAndLogin(firstUser);

    const putResponse = await request(app.getHttpServer())
      .put('/api/selected-coins')
      .set('Authorization', `Bearer ${token}`)
      .send({ coinIds: [1, 2] })
      .expect(200);

    const putBody = putResponse.body as ReplaceSelectedCoinsResponse;
    expect(putBody.message).toBe('Selected coins updated successfully');
    expect(putBody.items.map((coin) => coin.name)).toEqual([
      'Bitcoin',
      'Ethereum',
    ]);

    const getResponse = await request(app.getHttpServer())
      .get('/api/selected-coins')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect((getResponse.body as SelectedCoinsListResponse).items).toEqual(
      putBody.items,
    );
  });

  it('replaces selections by removing old values and adding new ones', async () => {
    const token = await registerAndLogin(firstUser);

    await request(app.getHttpServer())
      .put('/api/selected-coins')
      .set('Authorization', `Bearer ${token}`)
      .send({ coinIds: [1, 2, 3] })
      .expect(200);

    const response = await request(app.getHttpServer())
      .put('/api/selected-coins')
      .set('Authorization', `Bearer ${token}`)
      .send({ coinIds: [2, 4] })
      .expect(200);

    const body = response.body as ReplaceSelectedCoinsResponse;
    expect(body.items.map((coin) => coin.symbol)).toEqual(['ETH', 'XRP']);
  });

  it('clears all selections with an empty coinIds array', async () => {
    const token = await registerAndLogin(firstUser);

    await request(app.getHttpServer())
      .put('/api/selected-coins')
      .set('Authorization', `Bearer ${token}`)
      .send({ coinIds: [1] })
      .expect(200);

    const response = await request(app.getHttpServer())
      .put('/api/selected-coins')
      .set('Authorization', `Bearer ${token}`)
      .send({ coinIds: [] })
      .expect(200);

    expect((response.body as ReplaceSelectedCoinsResponse).items).toEqual([]);

    const getResponse = await request(app.getHttpServer())
      .get('/api/selected-coins')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect((getResponse.body as SelectedCoinsListResponse).items).toEqual([]);
  });

  it('rejects duplicate IDs with 400', async () => {
    const token = await registerAndLogin(firstUser);

    const response = await request(app.getHttpServer())
      .put('/api/selected-coins')
      .set('Authorization', `Bearer ${token}`)
      .send({ coinIds: [1, 1] })
      .expect(400);

    expect((response.body as ErrorResponseBody).statusCode).toBe(400);
  });

  it('rejects unknown coin IDs with 400', async () => {
    const token = await registerAndLogin(firstUser);

    const response = await request(app.getHttpServer())
      .put('/api/selected-coins')
      .set('Authorization', `Bearer ${token}`)
      .send({ coinIds: [999] })
      .expect(400);

    expect((response.body as ErrorResponseBody).statusCode).toBe(400);
  });

  it('rejects inactive coin IDs with 400', async () => {
    const token = await registerAndLogin(firstUser);
    await dataSource.query(
      'UPDATE coins SET "isActive" = false WHERE id = $1',
      [3],
    );

    const response = await request(app.getHttpServer())
      .put('/api/selected-coins')
      .set('Authorization', `Bearer ${token}`)
      .send({ coinIds: [3] })
      .expect(400);

    expect((response.body as ErrorResponseBody).statusCode).toBe(400);
  });

  it('rejects unknown fields with 400', async () => {
    const token = await registerAndLogin(firstUser);

    const response = await request(app.getHttpServer())
      .put('/api/selected-coins')
      .set('Authorization', `Bearer ${token}`)
      .send({ coinIds: [1], userId: 999 })
      .expect(400);

    expect((response.body as ErrorResponseBody).statusCode).toBe(400);
  });

  it('rejects missing coinIds with 400', async () => {
    const token = await registerAndLogin(firstUser);

    const response = await request(app.getHttpServer())
      .put('/api/selected-coins')
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(400);

    expect((response.body as ErrorResponseBody).statusCode).toBe(400);
  });

  it('does not expose join-table internals in responses', async () => {
    const token = await registerAndLogin(firstUser);

    const response = await request(app.getHttpServer())
      .put('/api/selected-coins')
      .set('Authorization', `Bearer ${token}`)
      .send({ coinIds: [1] })
      .expect(200);

    const body = response.body as ReplaceSelectedCoinsResponse;
    expect(body.items[0]).not.toHaveProperty('userId');
    expect(body.items[0]).not.toHaveProperty('coinId');
    expect(body.items[0]).not.toHaveProperty('createdAt');
    expect(body.items[0]).not.toHaveProperty('user');
    expect(body.items[0]).not.toHaveProperty('passwordHash');
  });

  it('keeps one user selections isolated from another user', async () => {
    const firstToken = await registerAndLogin(firstUser);
    const secondToken = await registerAndLogin(secondUser);

    await request(app.getHttpServer())
      .put('/api/selected-coins')
      .set('Authorization', `Bearer ${firstToken}`)
      .send({ coinIds: [1, 2] })
      .expect(200);

    const secondUserResponse = await request(app.getHttpServer())
      .get('/api/selected-coins')
      .set('Authorization', `Bearer ${secondToken}`)
      .expect(200);

    expect(
      (secondUserResponse.body as SelectedCoinsListResponse).items,
    ).toEqual([]);
  });
});
