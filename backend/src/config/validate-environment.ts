import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { EnvironmentVariables } from './environment-variables';

export function validateEnvironment(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const messages = errors
      .flatMap((error) => Object.values(error.constraints ?? {}))
      .join('; ');

    throw new Error(`Environment validation failed: ${messages}`);
  }

  if (
    validatedConfig.MARKET_STALE_TTL_SECONDS <
    validatedConfig.MARKET_CACHE_TTL_SECONDS
  ) {
    throw new Error(
      'Environment validation failed: MARKET_STALE_TTL_SECONDS must be greater than or equal to MARKET_CACHE_TTL_SECONDS',
    );
  }

  if (
    validatedConfig.NEWS_STALE_TTL_SECONDS <
    validatedConfig.NEWS_CACHE_TTL_SECONDS
  ) {
    throw new Error(
      'Environment validation failed: NEWS_STALE_TTL_SECONDS must be greater than or equal to NEWS_CACHE_TTL_SECONDS',
    );
  }

  return validatedConfig;
}
