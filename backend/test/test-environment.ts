export const TEST_DATABASE_NAME = 'moveo_crypto_advisor_test';

export const defaultTestEnvironment: Record<string, string> = {
  PORT: '3000',
  NODE_ENV: 'test',
  FRONTEND_URL: 'http://localhost:5173',
  JWT_SECRET: 'test-jwt-secret',
  JWT_EXPIRES_IN: '1h',
  DB_HOST: 'localhost',
  DB_PORT: '5433',
  DB_USERNAME: 'moveo_user',
  DB_PASSWORD: 'change_me',
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

export function applyDefaultTestEnvironment(): void {
  for (const [key, value] of Object.entries(defaultTestEnvironment)) {
    process.env[key] ??= value;
  }
}

export function applyE2eDatabaseEnvironment(): void {
  applyDefaultTestEnvironment();
  process.env.DB_NAME = TEST_DATABASE_NAME;
}
