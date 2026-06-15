import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AuthModule } from '../auth/auth.module';
import { SelectedCoinsModule } from '../selected-coins/selected-coins.module';
import { NewsDataClient } from './news-data.client';
import { NewsController } from './news.controller';
import { NewsService } from './news.service';

@Module({
  imports: [HttpModule, SelectedCoinsModule, AuthModule],
  controllers: [NewsController],
  providers: [NewsService, NewsDataClient],
  exports: [NewsDataClient],
})
export class NewsModule {}
