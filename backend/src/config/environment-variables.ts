import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  IsUrl,
  Max,
  Min,
} from 'class-validator';

export enum NodeEnvironment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number;

  @IsEnum(NodeEnvironment)
  NODE_ENV: NodeEnvironment;

  @IsString()
  @IsNotEmpty()
  DB_HOST: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  DB_PORT: number;

  @IsString()
  @IsNotEmpty()
  DB_USERNAME: string;

  @IsString()
  @IsNotEmpty()
  DB_PASSWORD: string;

  @IsString()
  @IsNotEmpty()
  DB_NAME: string;

  @IsUrl({ require_tld: false })
  FRONTEND_URL: string;

  @IsString()
  @IsNotEmpty()
  JWT_SECRET: string;

  @IsString()
  @IsNotEmpty()
  JWT_EXPIRES_IN: string;

  @IsUrl({ require_tld: false })
  COINGECKO_BASE_URL: string;

  @IsString()
  @IsNotEmpty()
  COINGECKO_API_KEY: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  COINGECKO_TIMEOUT_MS: number;

  @IsUrl({ require_tld: false })
  NEWSDATA_BASE_URL: string;

  @IsString()
  @IsNotEmpty()
  NEWSDATA_API_KEY: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  NEWSDATA_TIMEOUT_MS: number;

  @IsUrl({ require_tld: false })
  OPENROUTER_BASE_URL: string;

  @IsString()
  @IsNotEmpty()
  OPENROUTER_API_KEY: string;

  @IsString()
  @IsNotEmpty()
  OPENROUTER_MODEL: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  OPENROUTER_TIMEOUT_MS: number;

  @IsUrl({ require_tld: false })
  IMGFLIP_BASE_URL: string;

  @IsString()
  @IsNotEmpty()
  IMGFLIP_USERNAME: string;

  @IsString()
  @IsNotEmpty()
  IMGFLIP_PASSWORD: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  IMGFLIP_TEMPLATE_ID: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  IMGFLIP_TIMEOUT_MS: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  MARKET_CACHE_TTL_SECONDS: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  NEWS_CACHE_TTL_SECONDS: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  MARKET_STALE_TTL_SECONDS: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  NEWS_STALE_TTL_SECONDS: number;
}
