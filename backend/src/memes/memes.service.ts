import {
  BadGatewayException,
  BadRequestException,
  HttpException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  buildTemplatePoolVersion,
  parseImgflipTemplateIds,
} from '../config/imgflip-template-ids.utils';
import {
  buildMemeContextHash,
  getPreviousUtcDateString,
  getUtcDateString,
} from '../common/utils/daily-content.utils';
import { MarketService } from '../market/market.service';
import { PreferencesService } from '../preferences/preferences.service';
import { SelectedCoinsService } from '../selected-coins/selected-coins.service';
import { DailyMemeResponseDto } from './dto/daily-meme-response.dto';
import { DailyMeme } from './entities/daily-meme.entity';
import { MemeGenerationInput } from './interfaces/meme-generation.interfaces';
import { ImgflipClient } from './imgflip.client';
import {
  getEligibleCaptionVariationIds,
  getMovementCategory,
  selectMostVolatileMarketItem,
  type MemeCaptionVariationId,
} from './utils/meme-caption.builder';
import {
  buildCaptionsForSnapshot,
  buildMemeSourceSnapshot,
} from './utils/meme-snapshot.builder';
import {
  getTemplateAttemptOrder,
  selectMemeVariation,
} from './utils/meme-variation.utils';
import type { PreviousDayMemeSelection } from './interfaces/meme-generation.interfaces';

@Injectable()
export class MemesService {
  constructor(
    private readonly selectedCoinsService: SelectedCoinsService,
    private readonly preferencesService: PreferencesService,
    private readonly marketService: MarketService,
    private readonly imgflipClient: ImgflipClient,
    private readonly configService: ConfigService,
    @InjectRepository(DailyMeme)
    private readonly dailyMemeRepository: Repository<DailyMeme>,
  ) {}

  async tryGetValidStoredDailyMeme(
    userId: number,
  ): Promise<DailyMemeResponseDto | null> {
    const [{ items: selectedCoins }, preferences] = await Promise.all([
      this.selectedCoinsService.getSelectedCoins(userId),
      this.preferencesService.getPreferences(userId),
    ]);

    if (selectedCoins.length === 0) {
      return null;
    }

    const templateIds = this.getTemplateIds();
    const contextHash = buildMemeContextHash({
      userId,
      investorProfile: preferences.investorProfile,
      selectedCoinIds: selectedCoins.map((coin) => coin.id),
      templatePoolVersion: buildTemplatePoolVersion(templateIds),
    });
    const generatedForDate = getUtcDateString();
    const stored = await this.dailyMemeRepository.findOne({
      where: { userId, generatedForDate },
    });

    if (!stored || stored.contextHash !== contextHash) {
      return null;
    }

    return this.mapStoredMemeToResponse(stored);
  }

  async getDailyMeme(userId: number): Promise<DailyMemeResponseDto> {
    const stored = await this.tryGetValidStoredDailyMeme(userId);

    if (stored) {
      return stored;
    }

    const [{ items: selectedCoins }, preferences] = await Promise.all([
      this.selectedCoinsService.getSelectedCoins(userId),
      this.preferencesService.getPreferences(userId),
    ]);

    if (selectedCoins.length === 0) {
      throw new BadRequestException(
        'Select at least one coin before generating a meme',
      );
    }

    const { items: marketItems } =
      await this.marketService.getMarketData(userId);

    if (marketItems.length === 0) {
      throw new BadGatewayException('Unable to generate meme');
    }

    const generatedForDate = getUtcDateString();
    const previousDayMeme = await this.loadPreviousDayMeme(
      userId,
      generatedForDate,
    );

    return this.generateAndPersistFromMarketData(userId, {
      userId,
      investorProfile: preferences.investorProfile,
      generatedForDate,
      selectedCoins,
      marketItems,
      previousDayMeme,
    });
  }

  async generateAndPersistFromMarketData(
    userId: number,
    input: MemeGenerationInput,
  ): Promise<DailyMemeResponseDto> {
    if (input.selectedCoins.length === 0) {
      throw new BadRequestException(
        'Select at least one coin before generating a meme',
      );
    }

    if (input.marketItems.length === 0) {
      throw new BadGatewayException('Unable to generate meme');
    }

    const templateIds = this.getTemplateIds();
    const contextHash = buildMemeContextHash({
      userId,
      investorProfile: input.investorProfile,
      selectedCoinIds: input.selectedCoins.map((coin) => coin.id),
      templatePoolVersion: buildTemplatePoolVersion(templateIds),
    });
    const generatedForDate = input.generatedForDate;
    const existing = await this.dailyMemeRepository.findOne({
      where: { userId, generatedForDate },
    });

    if (existing && existing.contextHash === contextHash) {
      return this.mapStoredMemeToResponse(existing);
    }

    const previousDayMeme =
      input.previousDayMeme ??
      (await this.loadPreviousDayMeme(userId, generatedForDate));

    const generated = await this.generateFromMarketData({
      ...input,
      previousDayMeme,
    });
    const sourceDataSnapshot = buildMemeSourceSnapshot(
      input,
      generated.templateId,
      generated.captionVariationId,
    );

    await this.persistDailyMeme({
      userId,
      templateId: generated.templateId,
      imageUrl: generated.imageUrl,
      pageUrl: generated.pageUrl,
      textTop: generated.textTop,
      textBottom: generated.textBottom,
      generatedForDate,
      sourceDataSnapshot,
      contextHash,
    });

    const saved = await this.dailyMemeRepository.findOneOrFail({
      where: { userId, generatedForDate },
    });

    return this.mapStoredMemeToResponse(saved);
  }

  async generateFromMarketData(input: MemeGenerationInput): Promise<
    DailyMemeResponseDto & {
      templateId: number;
      captionVariationId: MemeCaptionVariationId;
    }
  > {
    if (input.selectedCoins.length === 0) {
      throw new BadRequestException(
        'Select at least one coin before generating a meme',
      );
    }

    if (input.marketItems.length === 0) {
      throw new BadGatewayException('Unable to generate meme');
    }

    const templateIds = this.getTemplateIds();
    const selectedMarketItem = selectMostVolatileMarketItem(
      input.marketItems.map((item) => ({
        symbol: item.symbol,
        name: item.name,
        changePercentage24h: item.changePercentage24h,
      })),
    );
    const movement = getMovementCategory(
      selectedMarketItem.changePercentage24h,
    );
    const eligibleCaptionVariationIds = getEligibleCaptionVariationIds(
      movement,
      input.investorProfile,
    );
    const variation = selectMemeVariation({
      userId: input.userId,
      generatedForDate: input.generatedForDate,
      investorProfile: input.investorProfile,
      selectedCoinIds: input.selectedCoins.map((coin) => coin.id),
      templateIds,
      eligibleCaptionVariationIds,
      previousDayMeme: input.previousDayMeme ?? null,
    });
    const captionVariationId = variation.captionVariationId;
    const captions = buildCaptionsForSnapshot(input, captionVariationId);
    const templateAttemptOrder = getTemplateAttemptOrder(
      templateIds,
      variation.templateIndex,
    );

    let lastError: unknown;

    for (
      let attemptIndex = 0;
      attemptIndex < Math.min(2, templateAttemptOrder.length);
      attemptIndex += 1
    ) {
      const templateId = templateAttemptOrder[attemptIndex];

      try {
        const meme = await this.imgflipClient.captionImage({
          templateId,
          text0: captions.textTop,
          text1: captions.textBottom,
        });

        return {
          imageUrl: meme.url,
          pageUrl: meme.pageUrl,
          textTop: captions.textTop,
          textBottom: captions.textBottom,
          generatedAt: new Date().toISOString(),
          templateId,
          captionVariationId,
        };
      } catch (error) {
        lastError = error;

        if (
          attemptIndex === 0 &&
          templateAttemptOrder.length > 1 &&
          error instanceof HttpException
        ) {
          continue;
        }

        throw error;
      }
    }

    if (lastError instanceof HttpException) {
      throw lastError;
    }

    throw new BadGatewayException('Unable to generate meme');
  }

  private async loadPreviousDayMeme(
    userId: number,
    generatedForDate: string,
  ): Promise<PreviousDayMemeSelection | null> {
    const previousDate = getPreviousUtcDateString(generatedForDate);
    const stored = await this.dailyMemeRepository.findOne({
      where: { userId, generatedForDate: previousDate },
    });

    if (!stored) {
      return null;
    }

    return {
      templateId: stored.templateId,
      captionVariationId: stored.sourceDataSnapshot.captionVariationId,
    };
  }

  private mapStoredMemeToResponse(stored: DailyMeme): DailyMemeResponseDto {
    return {
      imageUrl: stored.imageUrl,
      pageUrl: stored.pageUrl,
      textTop: stored.textTop,
      textBottom: stored.textBottom,
      generatedAt: stored.updatedAt.toISOString(),
    };
  }

  private getTemplateIds(): number[] {
    return parseImgflipTemplateIds(
      this.configService.getOrThrow<string>('IMGFLIP_TEMPLATE_IDS'),
    );
  }

  private async persistDailyMeme(
    record: Pick<
      DailyMeme,
      | 'userId'
      | 'templateId'
      | 'imageUrl'
      | 'pageUrl'
      | 'textTop'
      | 'textBottom'
      | 'generatedForDate'
      | 'sourceDataSnapshot'
      | 'contextHash'
    >,
  ): Promise<void> {
    await this.dailyMemeRepository.upsert(record, {
      conflictPaths: ['userId', 'generatedForDate'],
    });
  }
}
