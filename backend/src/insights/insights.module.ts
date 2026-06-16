import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AuthModule } from '../auth/auth.module';
import { MarketModule } from '../market/market.module';
import { NewsModule } from '../news/news.module';
import { PreferencesModule } from '../preferences/preferences.module';
import { SelectedCoinsModule } from '../selected-coins/selected-coins.module';
import { InsightsController } from './insights.controller';
import { InsightsService } from './insights.service';
import { OpenRouterClient } from './open-router.client';

@Module({
  imports: [
    HttpModule,
    AuthModule,
    PreferencesModule,
    SelectedCoinsModule,
    MarketModule,
    NewsModule,
  ],
  controllers: [InsightsController],
  providers: [InsightsService, OpenRouterClient],
  exports: [OpenRouterClient],
})
export class InsightsModule {}
