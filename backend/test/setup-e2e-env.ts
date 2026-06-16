import { config } from 'dotenv';
import { resolve } from 'path';
import { applyE2eDatabaseEnvironment } from './test-environment';

config({ path: resolve(__dirname, '../.env') });
applyE2eDatabaseEnvironment();
