import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getEnvironmentVariables } from './config/get-environment-variables';
import { validateEnvironment } from './config/validate-environment';
import { buildTypeOrmOptions } from './database/typeorm.config';
import { InsightsModule } from './insights/insights.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { CoinsModule } from './coins/coins.module';
import { MarketModule } from './market/market.module';
import { NewsModule } from './news/news.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { PreferencesModule } from './preferences/preferences.module';
import { SelectedCoinsModule } from './selected-coins/selected-coins.module';
import { UsersModule } from './users/users.module';

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
    UsersModule,
    AuthModule,
    CoinsModule,
    PreferencesModule,
    SelectedCoinsModule,
    OnboardingModule,
    MarketModule,
    NewsModule,
    InsightsModule,
  ],
})
export class AppModule {}
