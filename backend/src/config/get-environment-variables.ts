import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from './environment-variables';

export function getEnvironmentVariables(
  configService: ConfigService,
): EnvironmentVariables {
  return {
    PORT: configService.getOrThrow<number>('PORT'),
    NODE_ENV:
      configService.getOrThrow<EnvironmentVariables['NODE_ENV']>('NODE_ENV'),
    DB_HOST: configService.getOrThrow<string>('DB_HOST'),
    DB_PORT: configService.getOrThrow<number>('DB_PORT'),
    DB_USERNAME: configService.getOrThrow<string>('DB_USERNAME'),
    DB_PASSWORD: configService.getOrThrow<string>('DB_PASSWORD'),
    DB_NAME: configService.getOrThrow<string>('DB_NAME'),
    FRONTEND_URL: configService.getOrThrow<string>('FRONTEND_URL'),
    JWT_SECRET: configService.getOrThrow<string>('JWT_SECRET'),
    JWT_EXPIRES_IN: configService.getOrThrow<string>('JWT_EXPIRES_IN'),
    COINGECKO_BASE_URL: configService.getOrThrow<string>('COINGECKO_BASE_URL'),
    COINGECKO_API_KEY: configService.getOrThrow<string>('COINGECKO_API_KEY'),
    COINGECKO_TIMEOUT_MS: configService.getOrThrow<number>(
      'COINGECKO_TIMEOUT_MS',
    ),
    NEWSDATA_BASE_URL: configService.getOrThrow<string>('NEWSDATA_BASE_URL'),
    NEWSDATA_API_KEY: configService.getOrThrow<string>('NEWSDATA_API_KEY'),
    NEWSDATA_TIMEOUT_MS: configService.getOrThrow<number>(
      'NEWSDATA_TIMEOUT_MS',
    ),
    OPENROUTER_BASE_URL: configService.getOrThrow<string>(
      'OPENROUTER_BASE_URL',
    ),
    OPENROUTER_API_KEY: configService.getOrThrow<string>('OPENROUTER_API_KEY'),
    OPENROUTER_MODEL: configService.getOrThrow<string>('OPENROUTER_MODEL'),
    OPENROUTER_TIMEOUT_MS: configService.getOrThrow<number>(
      'OPENROUTER_TIMEOUT_MS',
    ),
  };
}
