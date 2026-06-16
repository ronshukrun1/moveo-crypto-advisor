import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CachedProviderResult } from '../common/interfaces/cached-provider-result.interface';
import { SafeCacheService } from '../cache/safe-cache.service';
import { SelectedCoinsService } from '../selected-coins/selected-coins.service';
import { MarketItemDto } from './dto/market-response.dto';
import { CoinGeckoClient } from './coin-gecko.client';
import { toMarketItemDto } from './mappers/market-response.mapper';
import { buildMarketCacheKey } from './utils/market-cache.utils';

type MarketDataResponse = { items: MarketItemDto[] };

@Injectable()
export class MarketService {
  private readonly logger = new Logger(MarketService.name);

  constructor(
    private readonly selectedCoinsService: SelectedCoinsService,
    private readonly coinGeckoClient: CoinGeckoClient,
    private readonly safeCacheService: SafeCacheService,
    private readonly configService: ConfigService,
  ) {}

  async getMarketData(userId: number): Promise<MarketDataResponse> {
    const result = await this.getMarketDataWithMetadata(userId);
    return result.data;
  }

  async getMarketDataWithMetadata(
    userId: number,
  ): Promise<CachedProviderResult<MarketDataResponse>> {
    const { items: selectedCoins } =
      await this.selectedCoinsService.getSelectedCoins(userId);

    if (selectedCoins.length === 0) {
      return { data: { items: [] }, isStale: false };
    }

    const coingeckoIds = selectedCoins.map((coin) => coin.coingeckoId);
    const freshKey = buildMarketCacheKey(coingeckoIds, 'fresh');
    const staleKey = buildMarketCacheKey(coingeckoIds, 'stale');
    const freshCached =
      await this.safeCacheService.get<MarketDataResponse>(freshKey);

    if (freshCached) {
      this.logCacheEvent('hit');
      return { data: freshCached, isStale: false };
    }

    this.logCacheEvent('miss');

    try {
      const result = await this.fetchMappedMarketData(selectedCoins);
      await this.storeFreshAndStale(freshKey, staleKey, result);
      return { data: result, isStale: false };
    } catch (error) {
      const staleCached =
        await this.safeCacheService.get<MarketDataResponse>(staleKey);

      if (staleCached) {
        this.logger.warn(
          'Market provider failed; using last-known cached data',
        );
        return { data: staleCached, isStale: true };
      }

      throw error;
    }
  }

  private async fetchMappedMarketData(
    selectedCoins: Array<{
      id: number;
      coingeckoId: string;
      symbol: string;
      name: string;
    }>,
  ): Promise<MarketDataResponse> {
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

    return { items };
  }

  private async storeFreshAndStale(
    freshKey: string,
    staleKey: string,
    data: MarketDataResponse,
  ): Promise<void> {
    const freshTtl = this.configService.getOrThrow<number>(
      'MARKET_CACHE_TTL_SECONDS',
    );
    const staleTtl = this.configService.getOrThrow<number>(
      'MARKET_STALE_TTL_SECONDS',
    );

    await this.safeCacheService.set(freshKey, data, freshTtl);
    await this.safeCacheService.set(staleKey, data, staleTtl);
  }

  private logCacheEvent(event: 'hit' | 'miss'): void {
    if (process.env.NODE_ENV === 'development') {
      this.logger.debug(`market cache ${event}`);
    }
  }
}
