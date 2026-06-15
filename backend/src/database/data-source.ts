import { config } from 'dotenv';
import { join } from 'path';
import { DataSource } from 'typeorm';
import { validateEnvironment } from '../config/validate-environment';
import { buildTypeOrmOptions } from './typeorm.config';

config({ path: join(__dirname, '../../.env') });

const validatedEnvironment = validateEnvironment(process.env);

export default new DataSource(buildTypeOrmOptions(validatedEnvironment));
