import 'reflect-metadata';
import { validateEnvironment } from './validate-environment';
import { NodeEnvironment } from './environment-variables';

describe('validateEnvironment', () => {
  const validConfig = {
    PORT: '3000',
    NODE_ENV: NodeEnvironment.Development,
    FRONTEND_URL: 'http://localhost:5173',
    JWT_SECRET: 'test-jwt-secret',
    JWT_EXPIRES_IN: '1h',
    DB_HOST: 'localhost',
    DB_PORT: '5432',
    DB_USERNAME: 'moveo_user',
    DB_PASSWORD: 'change_me',
    DB_NAME: 'moveo_crypto_advisor',
    COINGECKO_BASE_URL: 'https://api.coingecko.com/api/v3',
    COINGECKO_API_KEY: 'test-coingecko-api-key',
    COINGECKO_TIMEOUT_MS: '5000',
    NEWSDATA_BASE_URL: 'https://newsdata.io/api/1/crypto',
    NEWSDATA_API_KEY: 'test-newsdata-api-key',
    NEWSDATA_TIMEOUT_MS: '5000',
    OPENROUTER_BASE_URL: 'https://openrouter.ai/api/v1',
    OPENROUTER_API_KEY: 'test-openrouter-api-key',
    OPENROUTER_MODEL: 'openai/gpt-oss-20b:free',
    OPENROUTER_TIMEOUT_MS: '10000',
    IMGFLIP_BASE_URL: 'https://api.imgflip.com',
    IMGFLIP_USERNAME: 'test-imgflip-username',
    IMGFLIP_PASSWORD: 'test-imgflip-password',
    IMGFLIP_TEMPLATE_IDS:
      '87743020,102156234,112126428,124822590,129242436,181913649,188390779,217743513,438680,61520,61579',
    IMGFLIP_TIMEOUT_MS: '5000',
    MARKET_CACHE_TTL_SECONDS: '120',
    NEWS_CACHE_TTL_SECONDS: '300',
    MARKET_STALE_TTL_SECONDS: '1800',
    NEWS_STALE_TTL_SECONDS: '3600',
  };

  it('accepts a valid configuration', () => {
    const result = validateEnvironment(validConfig);

    expect(result.PORT).toBe(3000);
    expect(result.DB_PORT).toBe(5432);
    expect(result.NODE_ENV).toBe(NodeEnvironment.Development);
  });

  it('rejects a missing database password', () => {
    const configWithoutPassword: Record<string, unknown> = { ...validConfig };
    delete configWithoutPassword.DB_PASSWORD;

    expect(() => validateEnvironment(configWithoutPassword)).toThrow(
      /Environment validation failed/,
    );
  });

  it('rejects an invalid database port', () => {
    expect(() =>
      validateEnvironment({
        ...validConfig,
        DB_PORT: 'not-a-number',
      }),
    ).toThrow(/Environment validation failed/);
  });

  it('rejects an unsupported NODE_ENV value', () => {
    expect(() =>
      validateEnvironment({
        ...validConfig,
        NODE_ENV: 'staging',
      }),
    ).toThrow(/Environment validation failed/);
  });

  it('rejects market stale TTL below fresh TTL', () => {
    expect(() =>
      validateEnvironment({
        ...validConfig,
        MARKET_STALE_TTL_SECONDS: '60',
      }),
    ).toThrow(/MARKET_STALE_TTL_SECONDS must be greater than or equal/);
  });

  it('rejects news stale TTL below fresh TTL', () => {
    expect(() =>
      validateEnvironment({
        ...validConfig,
        NEWS_STALE_TTL_SECONDS: '60',
      }),
    ).toThrow(/NEWS_STALE_TTL_SECONDS must be greater than or equal/);
  });

  it('rejects a single Imgflip template ID', () => {
    expect(() =>
      validateEnvironment({
        ...validConfig,
        IMGFLIP_TEMPLATE_IDS: '181913649',
      }),
    ).toThrow(/at least two/i);
  });

  it('rejects invalid Imgflip template list values', () => {
    expect(() =>
      validateEnvironment({
        ...validConfig,
        IMGFLIP_TEMPLATE_IDS: '181913649,abc,87743020',
      }),
    ).toThrow(/positive numeric/i);
  });

  it('does not include secret values in validation errors', () => {
    let thrown: Error | undefined;

    try {
      validateEnvironment({
        ...validConfig,
        DB_PASSWORD: '',
      });
    } catch (error) {
      thrown = error as Error;
    }

    expect(thrown).toBeDefined();
    expect(thrown?.message).toMatch(/Environment validation failed/);
    expect(thrown?.message).not.toContain('change_me');
  });
});
