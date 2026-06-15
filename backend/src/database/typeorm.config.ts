import { join } from 'path';
import { Coin } from '../coins/entities/coin.entity';
import { UserPreference } from '../preferences/entities/user-preference.entity';
import { UserSelectedCoin } from '../selected-coins/entities/user-selected-coin.entity';
import { User } from '../users/entities/user.entity';
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
    entities: [User, Coin, UserPreference, UserSelectedCoin],
    migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
    logging:
      config.NODE_ENV === NodeEnvironment.Development
        ? ['error', 'warn', 'schema']
        : ['error'],
  };
}
