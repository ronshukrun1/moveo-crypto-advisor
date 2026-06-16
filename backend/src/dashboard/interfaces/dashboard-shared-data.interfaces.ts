import { MarketItemDto } from '../../market/dto/market-response.dto';
import { NewsItemDto } from '../../news/dto/news-response.dto';

export type SharedMarketDataResult =
  | { status: 'loaded'; items: MarketItemDto[]; isStale: boolean }
  | { status: 'failed' };

export type SharedNewsDataResult =
  | {
      status: 'loaded';
      items: NewsItemDto[];
      nextPage: string | null;
      isStale: boolean;
    }
  | { status: 'failed' };
