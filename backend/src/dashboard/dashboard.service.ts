import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { getUtcDateString } from '../common/utils/daily-content.utils';
import { DailyInsightResponseDto } from '../insights/dto/daily-insight-response.dto';
import { InsightsService } from '../insights/insights.service';
import { MarketService } from '../market/market.service';
import { DailyMemeResponseDto } from '../memes/dto/daily-meme-response.dto';
import { MemesService } from '../memes/memes.service';
import { NewsService } from '../news/news.service';
import { PreferencesService } from '../preferences/preferences.service';
import { SelectedCoinsService } from '../selected-coins/selected-coins.service';
import { UsersService } from '../users/users.service';
import {
  DASHBOARD_NEWS_LIMIT,
  DASHBOARD_SECTION_MESSAGES,
} from './constants/dashboard.constants';
import {
  DashboardInsightSectionDto,
  DashboardMarketSectionDto,
  DashboardMemeSectionDto,
  DashboardNewsSectionDto,
  DashboardResponseDto,
} from './dto/dashboard-response.dto';
import {
  SharedMarketDataResult,
  SharedNewsDataResult,
} from './interfaces/dashboard-shared-data.interfaces';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly preferencesService: PreferencesService,
    private readonly selectedCoinsService: SelectedCoinsService,
    private readonly marketService: MarketService,
    private readonly newsService: NewsService,
    private readonly insightsService: InsightsService,
    private readonly memesService: MemesService,
  ) {}

  async getDashboard(userId: number): Promise<DashboardResponseDto> {
    const user = await this.usersService.findById(userId);

    if (!user.onboardingCompleted) {
      throw new ConflictException(
        'Complete onboarding before accessing the dashboard',
      );
    }

    const preferences = await this.preferencesService.getPreferences(userId);
    const { items: selectedCoins } =
      await this.selectedCoinsService.getSelectedCoins(userId);

    const [storedInsight, storedMeme] = await Promise.all([
      preferences.showAiInsight
        ? this.insightsService.tryGetValidStoredDailyInsight(userId)
        : Promise.resolve(null),
      preferences.showMeme
        ? this.memesService.tryGetValidStoredDailyMeme(userId)
        : Promise.resolve(null),
    ]);

    const marketRequired =
      preferences.showMarketPrices ||
      (preferences.showAiInsight && !storedInsight) ||
      (preferences.showMeme && !storedMeme);
    const newsRequired =
      preferences.showNews || (preferences.showAiInsight && !storedInsight);

    const [sharedMarket, sharedNews] = await Promise.all([
      marketRequired
        ? this.loadSharedMarketData(userId)
        : Promise.resolve(null),
      newsRequired ? this.loadSharedNewsData(userId) : Promise.resolve(null),
    ]);

    const market = this.buildMarketSection(
      preferences.showMarketPrices,
      sharedMarket,
    );
    const news = this.buildNewsSection(preferences.showNews, sharedNews);

    const [insight, meme] = await Promise.all([
      this.buildInsightSection(
        preferences.showAiInsight,
        preferences.investorProfile,
        selectedCoins,
        sharedMarket,
        sharedNews,
        storedInsight,
        userId,
      ),
      this.buildMemeSection(
        preferences.showMeme,
        preferences.investorProfile,
        selectedCoins,
        sharedMarket,
        storedMeme,
        userId,
      ),
    ]);

    return {
      user: {
        id: user.id,
        name: user.name,
        onboardingCompleted: user.onboardingCompleted,
      },
      preferences: {
        investorProfile: preferences.investorProfile,
        showMarketPrices: preferences.showMarketPrices,
        showNews: preferences.showNews,
        showAiInsight: preferences.showAiInsight,
        showMeme: preferences.showMeme,
      },
      selectedCoins,
      market,
      news,
      insight,
      meme,
      generatedAt: new Date().toISOString(),
    };
  }

  private async loadSharedMarketData(
    userId: number,
  ): Promise<SharedMarketDataResult> {
    try {
      const { data, isStale } =
        await this.marketService.getMarketDataWithMetadata(userId);
      this.logger.debug('Dashboard shared market data loaded');
      return { status: 'loaded', items: data.items, isStale };
    } catch (error) {
      this.logSectionFailure('shared market', error);
      return { status: 'failed' };
    }
  }

  private async loadSharedNewsData(
    userId: number,
  ): Promise<SharedNewsDataResult> {
    try {
      const { data, isStale } = await this.newsService.getNewsWithMetadata(
        userId,
        { limit: DASHBOARD_NEWS_LIMIT },
      );
      this.logger.debug('Dashboard shared news data loaded');
      return {
        status: 'loaded',
        items: data.items,
        nextPage: data.nextPage,
        isStale,
      };
    } catch (error) {
      this.logSectionFailure('shared news', error);
      return { status: 'failed' };
    }
  }

  private buildMarketSection(
    isEnabled: boolean,
    sharedMarket: SharedMarketDataResult | null,
  ): DashboardMarketSectionDto {
    if (!isEnabled) {
      return { status: 'disabled' };
    }

    if (!sharedMarket || sharedMarket.status === 'failed') {
      return {
        status: 'unavailable',
        message: DASHBOARD_SECTION_MESSAGES.market,
      };
    }

    return {
      status: 'available',
      isStale: sharedMarket.isStale,
      items: sharedMarket.items,
    };
  }

  private buildNewsSection(
    isEnabled: boolean,
    sharedNews: SharedNewsDataResult | null,
  ): DashboardNewsSectionDto {
    if (!isEnabled) {
      return { status: 'disabled' };
    }

    if (!sharedNews || sharedNews.status === 'failed') {
      return {
        status: 'unavailable',
        message: DASHBOARD_SECTION_MESSAGES.news,
      };
    }

    return {
      status: 'available',
      isStale: sharedNews.isStale,
      items: sharedNews.items,
      nextPage: sharedNews.nextPage,
    };
  }

  private async buildInsightSection(
    isEnabled: boolean,
    investorProfile: DashboardResponseDto['preferences']['investorProfile'],
    selectedCoins: DashboardResponseDto['selectedCoins'],
    sharedMarket: SharedMarketDataResult | null,
    sharedNews: SharedNewsDataResult | null,
    storedInsight: DailyInsightResponseDto | null,
    userId: number,
  ): Promise<DashboardInsightSectionDto> {
    if (!isEnabled) {
      return { status: 'disabled' };
    }

    if (storedInsight) {
      return { status: 'available', data: storedInsight };
    }

    if (
      !sharedMarket ||
      sharedMarket.status === 'failed' ||
      sharedMarket.items.length === 0
    ) {
      return {
        status: 'unavailable',
        message: DASHBOARD_SECTION_MESSAGES.insight,
      };
    }

    if (!sharedNews || sharedNews.status === 'failed') {
      return {
        status: 'unavailable',
        message: DASHBOARD_SECTION_MESSAGES.insight,
      };
    }

    try {
      const data = await this.insightsService.generateAndPersistFromData(
        userId,
        {
          investorProfile,
          selectedCoins,
          marketItems: sharedMarket.items,
          newsItems: sharedNews.items,
        },
      );
      return { status: 'available', data };
    } catch (error) {
      this.logSectionFailure('insight', error);
      return {
        status: 'unavailable',
        message: DASHBOARD_SECTION_MESSAGES.insight,
      };
    }
  }

  private async buildMemeSection(
    isEnabled: boolean,
    investorProfile: DashboardResponseDto['preferences']['investorProfile'],
    selectedCoins: DashboardResponseDto['selectedCoins'],
    sharedMarket: SharedMarketDataResult | null,
    storedMeme: DailyMemeResponseDto | null,
    userId: number,
  ): Promise<DashboardMemeSectionDto> {
    if (!isEnabled) {
      return { status: 'disabled' };
    }

    if (storedMeme) {
      return { status: 'available', data: storedMeme };
    }

    if (
      !sharedMarket ||
      sharedMarket.status === 'failed' ||
      sharedMarket.items.length === 0
    ) {
      return {
        status: 'unavailable',
        message: DASHBOARD_SECTION_MESSAGES.meme,
      };
    }

    try {
      const data = await this.memesService.generateAndPersistFromMarketData(
        userId,
        {
          userId,
          investorProfile,
          generatedForDate: getUtcDateString(),
          selectedCoins,
          marketItems: sharedMarket.items,
        },
      );
      return { status: 'available', data };
    } catch (error) {
      this.logSectionFailure('meme', error);
      return {
        status: 'unavailable',
        message: DASHBOARD_SECTION_MESSAGES.meme,
      };
    }
  }

  private logSectionFailure(section: string, error: unknown): void {
    const message = error instanceof Error ? error.message : 'Unknown error';
    this.logger.warn(`Dashboard ${section} section failed: ${message}`);
  }
}
