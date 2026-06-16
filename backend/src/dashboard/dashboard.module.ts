import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { InsightsModule } from '../insights/insights.module';
import { MarketModule } from '../market/market.module';
import { MemesModule } from '../memes/memes.module';
import { NewsModule } from '../news/news.module';
import { PreferencesModule } from '../preferences/preferences.module';
import { SelectedCoinsModule } from '../selected-coins/selected-coins.module';
import { UsersModule } from '../users/users.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    PreferencesModule,
    SelectedCoinsModule,
    MarketModule,
    NewsModule,
    InsightsModule,
    MemesModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
