import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getEnvironmentVariables } from './config/get-environment-variables';
import { validateEnvironment } from './config/validate-environment';
import { buildTypeOrmOptions } from './database/typeorm.config';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        buildTypeOrmOptions(getEnvironmentVariables(configService)),
    }),
    HealthModule,
  ],
})
export class AppModule {}
