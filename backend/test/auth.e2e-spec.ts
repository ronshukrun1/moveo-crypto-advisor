import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { configureApplication } from '../src/app.setup';
import { User } from '../src/users/entities/user.entity';

interface AuthUserResponse {
  id: number;
  name: string;
  email: string;
  onboardingCompleted: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface RegisterResponseBody {
  message: string;
  user: AuthUserResponse;
}

interface LoginResponseBody {
  message: string;
  accessToken: string;
  user: AuthUserResponse;
}

interface ErrorResponseBody {
  statusCode: number;
  message: string;
  details?: string[];
}

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;

  const registerPayload = {
    name: 'Ron',
    email: 'ron@example.com',
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
    await dataSource.query('DELETE FROM users');
  });

  afterAll(async () => {
    await app.close();
  });

  it('registers a user successfully', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(registerPayload)
      .expect(201);

    const body = response.body as RegisterResponseBody;
    expect(body.message).toBe('User registered successfully');
    expect(body.user.email).toBe('ron@example.com');
    expect(body.user).not.toHaveProperty('passwordHash');
  });

  it('rejects duplicate email registration', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(registerPayload)
      .expect(201);

    const response = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(registerPayload)
      .expect(409);

    const body = response.body as ErrorResponseBody;
    expect(body.message).toContain('Email already registered');
  });

  it('rejects invalid registration bodies', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        name: 'Ron',
        email: 'not-an-email',
        password: 'short',
        unexpectedField: 'value',
      })
      .expect(400);

    const body = response.body as ErrorResponseBody;
    expect(body.statusCode).toBe(400);
    expect(body.details).toBeDefined();
  });

  it('logs in with valid credentials', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(registerPayload)
      .expect(201);

    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: registerPayload.email,
        password: registerPayload.password,
      })
      .expect(200);

    const body = response.body as LoginResponseBody;
    expect(body.message).toBe('Login successful');
    expect(body.accessToken).toEqual(expect.any(String));
    expect(body.user).not.toHaveProperty('passwordHash');
  });

  it('rejects invalid login credentials', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(registerPayload)
      .expect(201);

    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: registerPayload.email,
        password: 'WrongPass123!',
      })
      .expect(401);

    const body = response.body as ErrorResponseBody;
    expect(body.message).toBe('Invalid credentials');
  });

  it('returns the authenticated user for /api/auth/me', async () => {
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

    const loginBody = loginResponse.body as LoginResponseBody;
    const response = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${loginBody.accessToken}`)
      .expect(200);

    const body = response.body as AuthUserResponse;
    expect(body.email).toBe('ron@example.com');
    expect(body).not.toHaveProperty('passwordHash');
  });

  it('rejects /api/auth/me without a token', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/auth/me')
      .expect(401);

    const body = response.body as ErrorResponseBody;
    expect(body.statusCode).toBe(401);
  });

  it('rejects /api/auth/me with an invalid token', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid.token.value')
      .expect(401);

    const body = response.body as ErrorResponseBody;
    expect(body.statusCode).toBe(401);
  });

  it('stores a password hash in the database instead of plaintext', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(registerPayload)
      .expect(201);

    const storedUser = await dataSource.getRepository(User).findOne({
      where: { email: 'ron@example.com' },
    });

    expect(storedUser?.passwordHash).toBeDefined();
    expect(storedUser?.passwordHash).not.toBe(registerPayload.password);
    expect(storedUser?.passwordHash.startsWith('$2')).toBe(true);
  });
});
