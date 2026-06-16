import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CachedProviderResult } from '../common/interfaces/cached-provider-result.interface';
import { SafeCacheService } from '../cache/safe-cache.service';
import { SelectedCoinsService } from '../selected-coins/selected-coins.service';
import { GetNewsQueryDto } from './dto/get-news-query.dto';
import { NewsItemDto } from './dto/news-response.dto';
import { NewsDataClient } from './news-data.client';
import { processNewsArticles } from './utils/news-article-processing';
import { buildNewsCacheKey } from './utils/news-cache.utils';
import { toSelectedCoinsForRelevance } from './utils/news-relevance-filter';

const DEFAULT_NEWS_LIMIT = 5;

type NewsDataResponse = {
  items: NewsItemDto[];
  nextPage: string | null;
};

@Injectable()
export class NewsService {
  private readonly logger = new Logger(NewsService.name);

  constructor(
    private readonly selectedCoinsService: SelectedCoinsService,
    private readonly newsDataClient: NewsDataClient,
    private readonly safeCacheService: SafeCacheService,
    private readonly configService: ConfigService,
  ) {}

  async getNews(
    userId: number,
    query: GetNewsQueryDto,
  ): Promise<NewsDataResponse> {
    const result = await this.getNewsWithMetadata(userId, query);
    return result.data;
  }

  async getNewsWithMetadata(
    userId: number,
    query: GetNewsQueryDto,
  ): Promise<CachedProviderResult<NewsDataResponse>> {
    const { items: selectedCoins } =
      await this.selectedCoinsService.getSelectedCoins(userId);

    if (selectedCoins.length === 0) {
      return { data: { items: [], nextPage: null }, isStale: false };
    }

    const limit = query.limit ?? DEFAULT_NEWS_LIMIT;
    const symbols = selectedCoins.map((coin) => coin.symbol);
    const freshKey = buildNewsCacheKey(symbols, limit, query.page, 'fresh');
    const staleKey = buildNewsCacheKey(symbols, limit, query.page, 'stale');
    const freshCached =
      await this.safeCacheService.get<NewsDataResponse>(freshKey);

    if (freshCached) {
      this.logCacheEvent('hit');
      return { data: freshCached, isStale: false };
    }

    this.logCacheEvent('miss');

    try {
      const result = await this.fetchMappedNewsData(
        selectedCoins,
        limit,
        query.page,
      );
      await this.storeFreshAndStale(freshKey, staleKey, result);
      return { data: result, isStale: false };
    } catch (error) {
      const staleCached =
        await this.safeCacheService.get<NewsDataResponse>(staleKey);

      if (staleCached) {
        this.logger.warn('News provider failed; using last-known cached data');
        return { data: staleCached, isStale: true };
      }

      throw error;
    }
  }

  private async fetchMappedNewsData(
    selectedCoins: Array<{
      id: number;
      symbol: string;
      name: string;
      coingeckoId: string;
    }>,
    limit: number,
    page?: string,
  ): Promise<NewsDataResponse> {
    const symbols = selectedCoins.map((coin) => coin.symbol);
    const response = await this.newsDataClient.fetchNews({
      symbols,
      limit,
      page,
    });

    const processed = processNewsArticles(
      response.results,
      toSelectedCoinsForRelevance(selectedCoins),
      limit,
    );

    if (process.env.NODE_ENV === 'development') {
      this.logger.debug(
        `News relevance: receivedCount=${processed.receivedCount} filteredCount=${processed.filteredCount} returnedCount=${processed.returnedCount}`,
      );
    }

    return {
      items: processed.items,
      nextPage: response.nextPage,
    };
  }

  private async storeFreshAndStale(
    freshKey: string,
    staleKey: string,
    data: NewsDataResponse,
  ): Promise<void> {
    const freshTtl = this.configService.getOrThrow<number>(
      'NEWS_CACHE_TTL_SECONDS',
    );
    const staleTtl = this.configService.getOrThrow<number>(
      'NEWS_STALE_TTL_SECONDS',
    );

    await this.safeCacheService.set(freshKey, data, freshTtl);
    await this.safeCacheService.set(staleKey, data, staleTtl);
  }

  private logCacheEvent(event: 'hit' | 'miss'): void {
    if (process.env.NODE_ENV === 'development') {
      this.logger.debug(`news cache ${event}`);
    }
  }
}
