import { config } from 'dotenv';
import { resolve } from 'path';
import { applyDefaultTestEnvironment } from './test-environment';

config({ path: resolve(__dirname, '../.env') });
applyDefaultTestEnvironment();
