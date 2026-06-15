import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env') });

const defaultTestEnvironment = {
  PORT: '3000',
  NODE_ENV: 'test',
  FRONTEND_URL: 'http://localhost:5173',
  DB_HOST: 'localhost',
  DB_PORT: '5432',
  DB_USERNAME: 'moveo_user',
  DB_PASSWORD: 'change_me',
  DB_NAME: 'moveo_crypto_advisor',
};

for (const [key, value] of Object.entries(defaultTestEnvironment)) {
  process.env[key] ??= value;
}
