import {
  BadGatewayException,
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  buildMemeContextHash,
  getUtcDateString,
} from '../common/utils/daily-content.utils';
import { MarketService } from '../market/market.service';
import { SelectedCoinsService } from '../selected-coins/selected-coins.service';
import { DailyMemeResponseDto } from './dto/daily-meme-response.dto';
import { DailyMeme } from './entities/daily-meme.entity';
import { MemeGenerationInput } from './interfaces/meme-generation.interfaces';
import { ImgflipClient } from './imgflip.client';
import { buildMemeSourceSnapshot } from './utils/meme-snapshot.builder';
import { buildMemeCaptions } from './utils/meme-caption.builder';

@Injectable()
export class MemesService {
  constructor(
    private readonly selectedCoinsService: SelectedCoinsService,
    private readonly marketService: MarketService,
    private readonly imgflipClient: ImgflipClient,
    private readonly configService: ConfigService,
    @InjectRepository(DailyMeme)
    private readonly dailyMemeRepository: Repository<DailyMeme>,
  ) {}

  async tryGetValidStoredDailyMeme(
    userId: number,
  ): Promise<DailyMemeResponseDto | null> {
    const { items: selectedCoins } =
      await this.selectedCoinsService.getSelectedCoins(userId);

    if (selectedCoins.length === 0) {
      return null;
    }

    const templateId = this.getTemplateId();
    const contextHash = buildMemeContextHash(
      selectedCoins.map((coin) => coin.id),
      templateId,
    );
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

    const { items: selectedCoins } =
      await this.selectedCoinsService.getSelectedCoins(userId);

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

    return this.generateAndPersistFromMarketData(userId, {
      selectedCoins,
      marketItems,
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

    const templateId = this.getTemplateId();
    const contextHash = buildMemeContextHash(
      input.selectedCoins.map((coin) => coin.id),
      templateId,
    );
    const generatedForDate = getUtcDateString();
    const existing = await this.dailyMemeRepository.findOne({
      where: { userId, generatedForDate },
    });

    if (existing && existing.contextHash === contextHash) {
      return this.mapStoredMemeToResponse(existing);
    }

    const generated = await this.generateFromMarketData(input);
    const sourceDataSnapshot = buildMemeSourceSnapshot(input, templateId);

    await this.persistDailyMeme({
      userId,
      templateId,
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

  async generateFromMarketData(
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

    const captions = buildMemeCaptions(
      input.marketItems.map((item) => ({
        symbol: item.symbol,
        name: item.name,
        changePercentage24h: item.changePercentage24h,
      })),
    );

    const meme = await this.imgflipClient.captionImage({
      text0: captions.textTop,
      text1: captions.textBottom,
    });

    return {
      imageUrl: meme.url,
      pageUrl: meme.pageUrl,
      textTop: captions.textTop,
      textBottom: captions.textBottom,
      generatedAt: new Date().toISOString(),
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

  private getTemplateId(): number {
    return this.configService.getOrThrow<number>('IMGFLIP_TEMPLATE_ID');
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
