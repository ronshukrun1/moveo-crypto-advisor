import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Coin } from '../coins/entities/coin.entity';
import { DailyInsight } from '../insights/entities/daily-insight.entity';
import { DailyMeme } from '../memes/entities/daily-meme.entity';
import { UserSelectedCoin } from '../selected-coins/entities/user-selected-coin.entity';
import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';
import { Feedback } from './entities/feedback.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Feedback,
      Coin,
      UserSelectedCoin,
      DailyInsight,
      DailyMeme,
    ]),
  ],
  controllers: [FeedbackController],
  providers: [FeedbackService],
  exports: [FeedbackService],
})
export class FeedbackModule {}
