import { config } from 'dotenv';
import { resolve } from 'path';
import { ensureTestDatabase } from './ensure-test-database';
import { applyE2eDatabaseEnvironment } from './test-environment';

export default async function globalSetup(): Promise<void> {
  config({ path: resolve(__dirname, '../.env') });
  applyE2eDatabaseEnvironment();
  await ensureTestDatabase(process.env);
}
