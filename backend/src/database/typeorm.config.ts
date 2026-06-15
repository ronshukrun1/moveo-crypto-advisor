import { join } from 'path';
import { DataSourceOptions } from 'typeorm';
import {
  EnvironmentVariables,
  NodeEnvironment,
} from '../config/environment-variables';

export function buildTypeOrmOptions(
  config: EnvironmentVariables,
): DataSourceOptions {
  return {
    type: 'postgres',
    host: config.DB_HOST,
    port: config.DB_PORT,
    username: config.DB_USERNAME,
    password: config.DB_PASSWORD,
    database: config.DB_NAME,
    synchronize: false,
    migrationsRun: false,
    entities: [],
    migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
    logging:
      config.NODE_ENV === NodeEnvironment.Development
        ? ['error', 'warn', 'schema']
        : ['error'],
  };
}
