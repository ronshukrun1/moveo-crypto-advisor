import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { MarketModule } from '../market/market.module';
import { NewsModule } from '../news/news.module';
import { PreferencesModule } from '../preferences/preferences.module';
import { SelectedCoinsModule } from '../selected-coins/selected-coins.module';
import { InsightsController } from './insights.controller';
import { InsightsService } from './insights.service';
import { DailyInsight } from './entities/daily-insight.entity';
import { OpenRouterClient } from './open-router.client';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([DailyInsight]),
    AuthModule,
    PreferencesModule,
    SelectedCoinsModule,
    MarketModule,
    NewsModule,
  ],
  controllers: [InsightsController],
  providers: [InsightsService, OpenRouterClient],
  exports: [OpenRouterClient, InsightsService],
})
export class InsightsModule {}
