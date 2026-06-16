import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SafeCacheService } from '../cache/safe-cache.service';
import { SelectedCoinsService } from '../selected-coins/selected-coins.service';
import { GetNewsQueryDto } from './dto/get-news-query.dto';
import { NewsItemDto } from './dto/news-response.dto';
import { NewsDataClient } from './news-data.client';
import { processNewsArticles } from './utils/news-article-processing';
import { buildNewsCacheKey } from './utils/news-cache.utils';
import { toSelectedCoinsForRelevance } from './utils/news-relevance-filter';

const DEFAULT_NEWS_LIMIT = 5;

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
  ): Promise<{ items: NewsItemDto[]; nextPage: string | null }> {
    const { items: selectedCoins } =
      await this.selectedCoinsService.getSelectedCoins(userId);

    if (selectedCoins.length === 0) {
      return { items: [], nextPage: null };
    }

    const limit = query.limit ?? DEFAULT_NEWS_LIMIT;
    const symbols = selectedCoins.map((coin) => coin.symbol);
    const cacheKey = buildNewsCacheKey(symbols, limit, query.page);
    const cached = await this.safeCacheService.get<{
      items: NewsItemDto[];
      nextPage: string | null;
    }>(cacheKey);

    if (cached) {
      this.logCacheEvent('hit');
      return cached;
    }

    this.logCacheEvent('miss');

    const response = await this.newsDataClient.fetchNews({
      symbols,
      limit,
      page: query.page,
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

    const result = {
      items: processed.items,
      nextPage: response.nextPage,
    };

    await this.safeCacheService.set(
      cacheKey,
      result,
      this.configService.getOrThrow<number>('NEWS_CACHE_TTL_SECONDS'),
    );

    return result;
  }

  private logCacheEvent(event: 'hit' | 'miss'): void {
    if (process.env.NODE_ENV === 'development') {
      this.logger.debug(`news cache ${event}`);
    }
  }
}
