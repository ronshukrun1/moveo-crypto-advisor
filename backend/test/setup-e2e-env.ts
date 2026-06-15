import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env') });

const defaultTestEnvironment = {
  PORT: '3000',
  NODE_ENV: 'test',
  FRONTEND_URL: 'http://localhost:5173',
  JWT_SECRET: 'test-jwt-secret',
  JWT_EXPIRES_IN: '1h',
  DB_HOST: 'localhost',
  DB_PORT: '5433',
  DB_USERNAME: 'moveo_user',
  DB_PASSWORD: 'change_me',
  DB_NAME: 'moveo_crypto_advisor',
  COINGECKO_BASE_URL: 'https://api.coingecko.com/api/v3',
  COINGECKO_API_KEY: 'test-coingecko-api-key',
  COINGECKO_TIMEOUT_MS: '5000',
};

for (const [key, value] of Object.entries(defaultTestEnvironment)) {
  process.env[key] ??= value;
}
