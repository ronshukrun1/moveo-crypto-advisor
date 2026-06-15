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
  };
}
