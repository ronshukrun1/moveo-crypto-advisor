import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SafeCacheService } from '../cache/safe-cache.service';
import { SelectedCoinsService } from '../selected-coins/selected-coins.service';
import { MarketItemDto } from './dto/market-response.dto';
import { CoinGeckoClient } from './coin-gecko.client';
import { toMarketItemDto } from './mappers/market-response.mapper';
import { buildMarketCacheKey } from './utils/market-cache.utils';

@Injectable()
export class MarketService {
  private readonly logger = new Logger(MarketService.name);

  constructor(
    private readonly selectedCoinsService: SelectedCoinsService,
    private readonly coinGeckoClient: CoinGeckoClient,
    private readonly safeCacheService: SafeCacheService,
    private readonly configService: ConfigService,
  ) {}

  async getMarketData(userId: number): Promise<{ items: MarketItemDto[] }> {
    const { items: selectedCoins } =
      await this.selectedCoinsService.getSelectedCoins(userId);

    if (selectedCoins.length === 0) {
      return { items: [] };
    }

    const cacheKey = buildMarketCacheKey(
      selectedCoins.map((coin) => coin.coingeckoId),
    );
    const cached = await this.safeCacheService.get<{ items: MarketItemDto[] }>(
      cacheKey,
    );

    if (cached) {
      this.logCacheEvent('hit');
      return cached;
    }

    this.logCacheEvent('miss');

    const coingeckoIds = selectedCoins.map((coin) => coin.coingeckoId);
    const marketData = await this.coinGeckoClient.fetchMarkets(coingeckoIds);
    const marketDataById = new Map(marketData.map((item) => [item.id, item]));

    const items = selectedCoins
      .map((selectedCoin) => {
        const marketItem = marketDataById.get(selectedCoin.coingeckoId);

        if (!marketItem) {
          return null;
        }

        return toMarketItemDto(selectedCoin, marketItem);
      })
      .filter((item): item is MarketItemDto => item !== null);

    const result = { items };
    await this.safeCacheService.set(
      cacheKey,
      result,
      this.configService.getOrThrow<number>('MARKET_CACHE_TTL_SECONDS'),
    );

    return result;
  }

  private logCacheEvent(event: 'hit' | 'miss'): void {
    if (process.env.NODE_ENV === 'development') {
      this.logger.debug(`market cache ${event}`);
    }
  }
}
