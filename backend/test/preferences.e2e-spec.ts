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

interface PreferencesResponse {
  id: number;
  investorProfile: InvestorProfile;
  showMarketPrices: boolean;
  showNews: boolean;
  showAiInsight: boolean;
  showMeme: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UpdatePreferencesResponse {
  message: string;
  preferences: PreferencesResponse;
}

interface LoginResponseBody {
  accessToken: string;
}

interface ErrorResponseBody {
  statusCode: number;
  message: string;
  details?: string[];
}

describe('Preferences (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;

  const registerPayload = {
    name: 'Ron',
    email: 'prefs-user@example.com',
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

  it('GET /api/preferences without token returns 401', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/preferences')
      .expect(401);

    expect((response.body as ErrorResponseBody).statusCode).toBe(401);
  });

  it('returns default preferences on first authenticated GET', async () => {
    const token = await registerAndLogin();

    const response = await request(app.getHttpServer())
      .get('/api/preferences')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const body = response.body as PreferencesResponse;
    expect(body.investorProfile).toBe(InvestorProfile.BEGINNER);
    expect(body.showMarketPrices).toBe(true);
    expect(body.showNews).toBe(true);
    expect(body.showAiInsight).toBe(true);
    expect(body.showMeme).toBe(true);
    expect(body).not.toHaveProperty('user');
    expect(body).not.toHaveProperty('userId');
    expect(body).not.toHaveProperty('passwordHash');
  });

  it('repeated GET does not create duplicate preference records', async () => {
    const token = await registerAndLogin();

    await request(app.getHttpServer())
      .get('/api/preferences')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    await request(app.getHttpServer())
      .get('/api/preferences')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const count = await dataSource.getRepository(UserPreference).count();
    expect(count).toBe(1);
  });

  it('PATCH updates only supplied fields', async () => {
    const token = await registerAndLogin();

    const response = await request(app.getHttpServer())
      .patch('/api/preferences')
      .set('Authorization', `Bearer ${token}`)
      .send({
        investorProfile: InvestorProfile.LONG_TERM_HOLDER,
        showMeme: false,
      })
      .expect(200);

    const body = response.body as UpdatePreferencesResponse;
    expect(body.message).toBe('Preferences updated successfully');
    expect(body.preferences.investorProfile).toBe(
      InvestorProfile.LONG_TERM_HOLDER,
    );
    expect(body.preferences.showMeme).toBe(false);
    expect(body.preferences.showNews).toBe(true);
    expect(body.preferences).not.toHaveProperty('user');
    expect(body.preferences).not.toHaveProperty('userId');
  });

  it('rejects invalid enum values with 400', async () => {
    const token = await registerAndLogin();

    const response = await request(app.getHttpServer())
      .patch('/api/preferences')
      .set('Authorization', `Bearer ${token}`)
      .send({ investorProfile: 'INVALID_PROFILE' })
      .expect(400);

    expect((response.body as ErrorResponseBody).statusCode).toBe(400);
  });

  it('rejects unknown fields with 400', async () => {
    const token = await registerAndLogin();

    const response = await request(app.getHttpServer())
      .patch('/api/preferences')
      .set('Authorization', `Bearer ${token}`)
      .send({ userId: 999, showMeme: false })
      .expect(400);

    expect((response.body as ErrorResponseBody).statusCode).toBe(400);
  });

  it('rejects empty PATCH bodies with 400', async () => {
    const token = await registerAndLogin();

    const response = await request(app.getHttpServer())
      .patch('/api/preferences')
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(400);

    expect((response.body as ErrorResponseBody).statusCode).toBe(400);
  });
});
