import {
  BadGatewayException,
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { PreferencesService } from '../preferences/preferences.service';
import { SelectedCoinsService } from '../selected-coins/selected-coins.service';
import { MarketService } from '../market/market.service';
import { NewsService } from '../news/news.service';
import {
  INSIGHT_DISCLAIMER,
  INSIGHT_NEWS_LIMIT,
} from './constants/insight.constants';
import { DailyInsightResponseDto } from './dto/daily-insight-response.dto';
import { InsightGenerationInput } from './interfaces/insight-generation.interfaces';
import {
  InsightMarketFact,
  InsightNewsFact,
  InsightPromptContext,
} from './interfaces/insight-context.interfaces';
import { OpenRouterClient } from './open-router.client';
import { buildInsightMessages } from './utils/insight-prompt.builder';
import { parseModelInsightContent } from './utils/insight-output.validation';

@Injectable()
export class InsightsService {
  constructor(
    private readonly preferencesService: PreferencesService,
    private readonly selectedCoinsService: SelectedCoinsService,
    private readonly marketService: MarketService,
    private readonly newsService: NewsService,
    private readonly openRouterClient: OpenRouterClient,
  ) {}

  async getDailyInsight(userId: number): Promise<DailyInsightResponseDto> {
    const preferences = await this.preferencesService.getPreferences(userId);
    const { items: selectedCoins } =
      await this.selectedCoinsService.getSelectedCoins(userId);

    if (selectedCoins.length === 0) {
      throw new BadRequestException(
        'Select at least one coin before generating an insight',
      );
    }

    const { items: marketItems } =
      await this.marketService.getMarketData(userId);

    if (marketItems.length === 0) {
      throw new BadGatewayException('Unable to generate insight');
    }

    const { items: newsItems } = await this.newsService.getNews(userId, {
      limit: INSIGHT_NEWS_LIMIT,
    });

    return this.generateFromData({
      investorProfile: preferences.investorProfile,
      selectedCoins,
      marketItems,
      newsItems,
    });
  }

  async generateFromData(
    input: InsightGenerationInput,
  ): Promise<DailyInsightResponseDto> {
    if (input.selectedCoins.length === 0) {
      throw new BadRequestException(
        'Select at least one coin before generating an insight',
      );
    }

    if (input.marketItems.length === 0) {
      throw new BadGatewayException('Unable to generate insight');
    }

    const context = this.buildPromptContext(
      input.investorProfile,
      input.selectedCoins,
      input.marketItems,
      input.newsItems,
    );

    const messages = buildInsightMessages(context);
    const modelContent =
      await this.openRouterClient.generateInsightContent(messages);
    const modelOutput = parseModelInsightContent(modelContent);

    return {
      title: modelOutput.title,
      insight: modelOutput.insight,
      disclaimer: INSIGHT_DISCLAIMER,
      generatedAt: new Date().toISOString(),
    };
  }

  private buildPromptContext(
    investorProfile: InsightPromptContext['investorProfile'],
    selectedCoins: Array<{
      symbol: string;
      name: string;
    }>,
    marketItems: Array<{
      symbol: string;
      name: string;
      currentPrice: number | null;
      changePercentage24h: number | null;
      high24h: number | null;
      low24h: number | null;
    }>,
    newsItems: Array<{
      title: string;
      description: string | null;
    }>,
  ): InsightPromptContext {
    const marketFacts: InsightMarketFact[] = marketItems.map((item) => ({
      symbol: item.symbol,
      name: item.name,
      currentPrice: item.currentPrice,
      changePercentage24h: item.changePercentage24h,
      high24h: item.high24h,
      low24h: item.low24h,
    }));

    const newsFacts: InsightNewsFact[] = newsItems.map((item) => ({
      title: item.title,
      description: item.description,
    }));

    return {
      investorProfile,
      selectedCoins: selectedCoins.map((coin) => ({
        symbol: coin.symbol,
        name: coin.name,
      })),
      marketFacts,
      newsFacts,
    };
  }
}
