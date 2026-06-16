import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Coin } from '../coins/entities/coin.entity';
import { DailyInsight } from '../insights/entities/daily-insight.entity';
import { DailyMeme } from '../memes/entities/daily-meme.entity';
import { UserSelectedCoin } from '../selected-coins/entities/user-selected-coin.entity';
import {
  FeedbackListResponseDto,
  FeedbackResponseDto,
} from './dto/feedback-response.dto';
import { UpsertFeedbackDto } from './dto/upsert-feedback.dto';
import { Feedback } from './entities/feedback.entity';
import { FeedbackContentType } from './enums/feedback-content-type.enum';
import {
  parseInsightFeedbackContentId,
  parseMarketFeedbackContentId,
  parseMemeFeedbackContentId,
} from './utils/feedback-content-id.utils';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(Feedback)
    private readonly feedbackRepository: Repository<Feedback>,
    @InjectRepository(Coin)
    private readonly coinRepository: Repository<Coin>,
    @InjectRepository(UserSelectedCoin)
    private readonly userSelectedCoinRepository: Repository<UserSelectedCoin>,
    @InjectRepository(DailyInsight)
    private readonly dailyInsightRepository: Repository<DailyInsight>,
    @InjectRepository(DailyMeme)
    private readonly dailyMemeRepository: Repository<DailyMeme>,
  ) {}

  async upsertFeedback(
    userId: number,
    dto: UpsertFeedbackDto,
  ): Promise<FeedbackResponseDto> {
    await this.validateContentTarget(userId, dto.contentType, dto.contentId);

    await this.feedbackRepository.upsert(
      {
        userId,
        contentType: dto.contentType,
        contentId: dto.contentId,
        feedbackType: dto.feedbackType,
      },
      {
        conflictPaths: ['userId', 'contentType', 'contentId'],
      },
    );

    const saved = await this.feedbackRepository.findOneOrFail({
      where: {
        userId,
        contentType: dto.contentType,
        contentId: dto.contentId,
      },
    });

    return this.toResponseDto(saved);
  }

  async getFeedback(
    userId: number,
    contentIds: string[] = [],
  ): Promise<FeedbackListResponseDto> {
    if (contentIds.length === 0) {
      return { items: [] };
    }

    const uniqueContentIds = [...new Set(contentIds)];
    const items = await this.feedbackRepository.find({
      where: {
        userId,
        contentId: In(uniqueContentIds),
      },
    });

    return {
      items: items.map((item) => this.toResponseDto(item)),
    };
  }

  private async validateContentTarget(
    userId: number,
    contentType: FeedbackContentType,
    contentId: string,
  ): Promise<void> {
    switch (contentType) {
      case FeedbackContentType.MARKET:
        await this.validateMarketContent(userId, contentId);
        return;
      case FeedbackContentType.NEWS:
        this.validateNewsContent(contentId);
        return;
      case FeedbackContentType.INSIGHT:
        await this.validateInsightContent(userId, contentId);
        return;
      case FeedbackContentType.MEME:
        await this.validateMemeContent(userId, contentId);
        return;
      default:
        throw new BadRequestException('Invalid content type');
    }
  }

  private async validateMarketContent(
    userId: number,
    contentId: string,
  ): Promise<void> {
    const coinId = parseMarketFeedbackContentId(contentId);

    if (!coinId) {
      throw new BadRequestException('Invalid market content target');
    }

    const [coin, selection] = await Promise.all([
      this.coinRepository.findOne({ where: { id: coinId, isActive: true } }),
      this.userSelectedCoinRepository.findOne({
        where: { userId, coinId },
      }),
    ]);

    if (!coin || !selection) {
      throw new NotFoundException('Content target not found');
    }
  }

  private validateNewsContent(contentId: string): void {
    if (!contentId.trim()) {
      throw new BadRequestException('Invalid news content target');
    }
  }

  private async validateInsightContent(
    userId: number,
    contentId: string,
  ): Promise<void> {
    const insightId = parseInsightFeedbackContentId(contentId);

    if (!insightId) {
      throw new BadRequestException('Invalid insight content target');
    }

    const insight = await this.dailyInsightRepository.findOne({
      where: { id: insightId, userId },
    });

    if (!insight) {
      throw new NotFoundException('Content target not found');
    }
  }

  private async validateMemeContent(
    userId: number,
    contentId: string,
  ): Promise<void> {
    const memeId = parseMemeFeedbackContentId(contentId);

    if (!memeId) {
      throw new BadRequestException('Invalid meme content target');
    }

    const meme = await this.dailyMemeRepository.findOne({
      where: { id: memeId, userId },
    });

    if (!meme) {
      throw new NotFoundException('Content target not found');
    }
  }

  private toResponseDto(feedback: Feedback): FeedbackResponseDto {
    return {
      contentType: feedback.contentType,
      contentId: feedback.contentId,
      feedbackType: feedback.feedbackType,
      updatedAt: feedback.updatedAt.toISOString(),
    };
  }
}
