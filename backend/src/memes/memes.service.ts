import {
  BadGatewayException,
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { MarketService } from '../market/market.service';
import { SelectedCoinsService } from '../selected-coins/selected-coins.service';
import { DailyMemeResponseDto } from './dto/daily-meme-response.dto';
import { MemeGenerationInput } from './interfaces/meme-generation.interfaces';
import { ImgflipClient } from './imgflip.client';
import { buildMemeCaptions } from './utils/meme-caption.builder';

@Injectable()
export class MemesService {
  constructor(
    private readonly selectedCoinsService: SelectedCoinsService,
    private readonly marketService: MarketService,
    private readonly imgflipClient: ImgflipClient,
  ) {}

  async getDailyMeme(userId: number): Promise<DailyMemeResponseDto> {
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

    return this.generateFromMarketData({
      selectedCoins,
      marketItems,
    });
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
}
