import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { MarketModule } from '../market/market.module';
import { SelectedCoinsModule } from '../selected-coins/selected-coins.module';
import { DailyMeme } from './entities/daily-meme.entity';
import { ImgflipClient } from './imgflip.client';
import { MemesController } from './memes.controller';
import { MemesService } from './memes.service';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([DailyMeme]),
    AuthModule,
    SelectedCoinsModule,
    MarketModule,
  ],
  controllers: [MemesController],
  providers: [MemesService, ImgflipClient],
  exports: [ImgflipClient, MemesService],
})
export class MemesModule {}
