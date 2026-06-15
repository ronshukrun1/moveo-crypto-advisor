import { Injectable } from '@nestjs/common';
import { SelectedCoinsService } from '../selected-coins/selected-coins.service';
import { GetNewsQueryDto } from './dto/get-news-query.dto';
import { NewsItemDto } from './dto/news-response.dto';
import { NewsDataClient } from './news-data.client';
import { mapNewsArticles } from './utils/news-article-processing';

const DEFAULT_NEWS_LIMIT = 5;

@Injectable()
export class NewsService {
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

    const symbols = selectedCoins.map((coin) => coin.symbol);
    const limit = query.limit ?? DEFAULT_NEWS_LIMIT;
    const response = await this.newsDataClient.fetchNews({
      symbols,
      limit,
      page: query.page,
    });

    return {
      items: mapNewsArticles(response.results),
      nextPage: response.nextPage,
    };
  }
}
