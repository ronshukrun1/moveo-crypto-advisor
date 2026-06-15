import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { configureApplication } from '../src/app.setup';
import { InvestorProfile } from '../src/preferences/enums/investor-profile.enum';
import { UserPreference } from '../src/preferences/entities/user-preference.entity';

interface CoinItemResponse {
  id: number;
  coingeckoId: string;
  symbol: string;
  name: string;
}

interface OnboardingPreferencesResponse {
  investorProfile: InvestorProfile;
  showMarketPrices: boolean;
  showNews: boolean;
  showAiInsight: boolean;
  showMeme: boolean;
}

interface OnboardingResponse {
  message: string;
  onboardingCompleted: boolean;
  preferences: OnboardingPreferencesResponse;
  selectedCoins: CoinItemResponse[];
}

interface PreferencesResponse {
  investorProfile: InvestorProfile;
  showMarketPrices: boolean;
  showNews: boolean;
  showAiInsight: boolean;
  showMeme: boolean;
}

interface SelectedCoinsListResponse {
  items: CoinItemResponse[];
}

interface AuthUserResponse {
  onboardingCompleted: boolean;
}

interface LoginResponseBody {
  accessToken: string;
}

interface ErrorResponseBody {
  statusCode: number;
  message: string | string[];
  details?: string[];
}

describe('Onboarding (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;

  const registerPayload = {
    name: 'Ron',
    email: 'onboarding-user@example.com',
    password: 'StrongPass123!',
  };

  const validOnboardingPayload = {
    investorProfile: InvestorProfile.LONG_TERM_HOLDER,
    showMarketPrices: true,
    showNews: true,
    showAiInsight: true,
    showMeme: false,
    coinIds: [1, 2],
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

  it('POST /api/onboarding without token returns 401', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/onboarding')
      .send(validOnboardingPayload)
      .expect(401);

    expect((response.body as ErrorResponseBody).statusCode).toBe(401);
  });

  it('completes onboarding successfully', async () => {
    const token = await registerAndLogin();

    const response = await request(app.getHttpServer())
      .post('/api/onboarding')
      .set('Authorization', `Bearer ${token}`)
      .send(validOnboardingPayload)
      .expect(200);

    const body = response.body as OnboardingResponse;
    expect(body.message).toBe('Onboarding completed successfully');
    expect(body.onboardingCompleted).toBe(true);
    expect(body.preferences.investorProfile).toBe(
      InvestorProfile.LONG_TERM_HOLDER,
    );
    expect(body.selectedCoins.map((coin) => coin.symbol)).toEqual([
      'BTC',
      'ETH',
    ]);
  });

  it('persists preferences and selected coins', async () => {
    const token = await registerAndLogin();

    await request(app.getHttpServer())
      .post('/api/onboarding')
      .set('Authorization', `Bearer ${token}`)
      .send(validOnboardingPayload)
      .expect(200);

    const preferencesResponse = await request(app.getHttpServer())
      .get('/api/preferences')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const preferencesBody = preferencesResponse.body as PreferencesResponse;
    expect(preferencesBody.investorProfile).toBe(
      InvestorProfile.LONG_TERM_HOLDER,
    );
    expect(preferencesBody.showMeme).toBe(false);

    const selectedCoinsResponse = await request(app.getHttpServer())
      .get('/api/selected-coins')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(
      (selectedCoinsResponse.body as SelectedCoinsListResponse).items,
    ).toHaveLength(2);
  });

  it('marks onboardingCompleted true on /api/auth/me', async () => {
    const token = await registerAndLogin();

    await request(app.getHttpServer())
      .post('/api/onboarding')
      .set('Authorization', `Bearer ${token}`)
      .send(validOnboardingPayload)
      .expect(200);

    const meResponse = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect((meResponse.body as AuthUserResponse).onboardingCompleted).toBe(
      true,
    );
  });

  it('replaces prior selections and preferences on repeated onboarding', async () => {
    const token = await registerAndLogin();

    await request(app.getHttpServer())
      .post('/api/onboarding')
      .set('Authorization', `Bearer ${token}`)
      .send(validOnboardingPayload)
      .expect(200);

    const response = await request(app.getHttpServer())
      .post('/api/onboarding')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ...validOnboardingPayload,
        investorProfile: InvestorProfile.ACTIVE_TRADER,
        showMeme: true,
        coinIds: [3],
      })
      .expect(200);

    const body = response.body as OnboardingResponse;
    expect(body.preferences.investorProfile).toBe(
      InvestorProfile.ACTIVE_TRADER,
    );
    expect(body.selectedCoins).toHaveLength(1);
    expect(body.selectedCoins[0].symbol).toBe('SOL');
    expect(body.onboardingCompleted).toBe(true);
  });

  it('rejects duplicate coin IDs with 400', async () => {
    const token = await registerAndLogin();

    const response = await request(app.getHttpServer())
      .post('/api/onboarding')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validOnboardingPayload, coinIds: [1, 1] })
      .expect(400);

    expect((response.body as ErrorResponseBody).statusCode).toBe(400);
  });

  it('rejects unknown coin IDs with 400', async () => {
    const token = await registerAndLogin();

    const response = await request(app.getHttpServer())
      .post('/api/onboarding')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validOnboardingPayload, coinIds: [999] })
      .expect(400);

    expect((response.body as ErrorResponseBody).statusCode).toBe(400);
  });

  it('rejects inactive coin IDs with 400', async () => {
    const token = await registerAndLogin();
    await dataSource.query(
      'UPDATE coins SET "isActive" = false WHERE id = $1',
      [3],
    );

    const response = await request(app.getHttpServer())
      .post('/api/onboarding')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validOnboardingPayload, coinIds: [3] })
      .expect(400);

    expect((response.body as ErrorResponseBody).statusCode).toBe(400);
  });

  it('rejects empty coinIds with 400', async () => {
    const token = await registerAndLogin();

    const response = await request(app.getHttpServer())
      .post('/api/onboarding')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validOnboardingPayload, coinIds: [] })
      .expect(400);

    expect((response.body as ErrorResponseBody).statusCode).toBe(400);
  });

  it('rejects unknown fields with 400', async () => {
    const token = await registerAndLogin();

    const response = await request(app.getHttpServer())
      .post('/api/onboarding')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validOnboardingPayload, userId: 999 })
      .expect(400);

    expect((response.body as ErrorResponseBody).statusCode).toBe(400);
  });

  it('does not expose internal fields in responses', async () => {
    const token = await registerAndLogin();

    const response = await request(app.getHttpServer())
      .post('/api/onboarding')
      .set('Authorization', `Bearer ${token}`)
      .send(validOnboardingPayload)
      .expect(200);

    const body = response.body as OnboardingResponse;
    expect(body.preferences).not.toHaveProperty('id');
    expect(body.preferences).not.toHaveProperty('userId');
    expect(body.selectedCoins[0]).not.toHaveProperty('coinId');
    expect(body.selectedCoins[0]).not.toHaveProperty('createdAt');
    expect(body).not.toHaveProperty('passwordHash');
  });

  it('leaves previous state unchanged when onboarding fails', async () => {
    const token = await registerAndLogin();

    await request(app.getHttpServer())
      .post('/api/onboarding')
      .set('Authorization', `Bearer ${token}`)
      .send(validOnboardingPayload)
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/onboarding')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validOnboardingPayload, coinIds: [999] })
      .expect(400);

    const preferences = await dataSource.getRepository(UserPreference).find();
    expect(preferences).toHaveLength(1);
    expect(preferences[0].investorProfile).toBe(
      InvestorProfile.LONG_TERM_HOLDER,
    );

    const selectedCoinsResponse = await request(app.getHttpServer())
      .get('/api/selected-coins')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(
      (selectedCoinsResponse.body as SelectedCoinsListResponse).items,
    ).toHaveLength(2);

    const meResponse = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect((meResponse.body as AuthUserResponse).onboardingCompleted).toBe(
      true,
    );
  });
});
