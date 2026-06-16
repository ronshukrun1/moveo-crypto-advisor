import { Injectable, Logger } from '@nestjs/common';
import { SelectedCoinsService } from '../selected-coins/selected-coins.service';
import { GetNewsQueryDto } from './dto/get-news-query.dto';
import { NewsItemDto } from './dto/news-response.dto';
import { NewsDataClient } from './news-data.client';
import { processNewsArticles } from './utils/news-article-processing';
import { toSelectedCoinsForRelevance } from './utils/news-relevance-filter';

const DEFAULT_NEWS_LIMIT = 5;

@Injectable()
export class NewsService {
  private readonly logger = new Logger(NewsService.name);

  constructor(
    private readonly selectedCoinsService: SelectedCoinsService,
    private readonly newsDataClient: NewsDataClient,
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
    const response = await this.newsDataClient.fetchNews({
      symbols: selectedCoins.map((coin) => coin.symbol),
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

    return {
      items: processed.items,
      nextPage: response.nextPage,
    };
  }
}
