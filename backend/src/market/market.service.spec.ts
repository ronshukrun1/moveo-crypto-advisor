import {
  BadGatewayException,
  GatewayTimeoutException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CoinGeckoClient } from './coin-gecko.client';
import { MarketService } from './market.service';
import { SelectedCoinsService } from '../selected-coins/selected-coins.service';
import { SafeCacheService } from '../cache/safe-cache.service';
import { buildMarketCacheKey } from './utils/market-cache.utils';

describe('MarketService', () => {
  let marketService: MarketService;
  let selectedCoinsService: { getSelectedCoins: jest.Mock };
  let coinGeckoClient: { fetchMarkets: jest.Mock };
  let safeCacheService: { get: jest.Mock; set: jest.Mock };

  const userId = 1;

  const selectedBitcoin = {
    id: 1,
    coingeckoId: 'bitcoin',
    symbol: 'BTC',
    name: 'Bitcoin',
  };

  const mappedBitcoin = {
    id: 'bitcoin',
    symbol: 'BTC',
    name: 'Bitcoin',
    imageUrl: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
    currentPrice: 65823,
    marketCap: 1319912956634,
    marketCapRank: 1,
    totalVolume: 25204772698,
    high24h: 65893,
    low24h: 63663,
    priceChange24h: 1395.9,
    changePercentage24h: 2.17,
    lastUpdated: '2026-06-15T06:11:30.617Z',
  };

  beforeEach(async () => {
    selectedCoinsService = {
      getSelectedCoins: jest.fn(),
    };
    coinGeckoClient = {
      fetchMarkets: jest.fn(),
    };
    safeCacheService = {
      get: jest.fn().mockResolvedValue(undefined),
      set: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarketService,
        {
          provide: SelectedCoinsService,
          useValue: selectedCoinsService,
        },
        {
          provide: CoinGeckoClient,
          useValue: coinGeckoClient,
        },
        {
          provide: SafeCacheService,
          useValue: safeCacheService,
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn((key: string) => {
              if (key === 'MARKET_CACHE_TTL_SECONDS') {
                return 120;
              }

              throw new Error(`Unexpected config key: ${key}`);
            }),
          },
        },
      ],
    }).compile();

    marketService = module.get(MarketService);
  });

  it('returns an empty list without calling CoinGecko when no coins are selected', async () => {
    selectedCoinsService.getSelectedCoins.mockResolvedValue({ items: [] });

    const result = await marketService.getMarketData(userId);

    expect(result).toEqual({ items: [] });
    expect(coinGeckoClient.fetchMarkets).not.toHaveBeenCalled();
    expect(safeCacheService.get).not.toHaveBeenCalled();
    expect(safeCacheService.set).not.toHaveBeenCalled();
  });

  it('returns cached market data without calling CoinGecko on a cache hit', async () => {
    selectedCoinsService.getSelectedCoins.mockResolvedValue({
      items: [selectedBitcoin],
    });
    safeCacheService.get.mockResolvedValue({ items: [mappedBitcoin] });

    const result = await marketService.getMarketData(userId);

    expect(result).toEqual({ items: [mappedBitcoin] });
    expect(safeCacheService.get).toHaveBeenCalledWith(
      buildMarketCacheKey(['bitcoin']),
    );
    expect(coinGeckoClient.fetchMarkets).not.toHaveBeenCalled();
    expect(safeCacheService.set).not.toHaveBeenCalled();
  });

  it('stores mapped market data on a cache miss', async () => {
    selectedCoinsService.getSelectedCoins.mockResolvedValue({
      items: [selectedBitcoin],
    });
    coinGeckoClient.fetchMarkets.mockResolvedValue([
      {
        id: 'bitcoin',
        symbol: 'btc',
        name: 'Bitcoin',
        image: mappedBitcoin.imageUrl,
        current_price: mappedBitcoin.currentPrice,
        market_cap: mappedBitcoin.marketCap,
        market_cap_rank: mappedBitcoin.marketCapRank,
        total_volume: mappedBitcoin.totalVolume,
        high_24h: mappedBitcoin.high24h,
        low_24h: mappedBitcoin.low24h,
        price_change_24h: mappedBitcoin.priceChange24h,
        price_change_percentage_24h: mappedBitcoin.changePercentage24h,
        last_updated: mappedBitcoin.lastUpdated,
      },
    ]);

    await marketService.getMarketData(userId);

    expect(coinGeckoClient.fetchMarkets).toHaveBeenCalledWith(['bitcoin']);
    expect(safeCacheService.set).toHaveBeenCalledWith(
      buildMarketCacheKey(['bitcoin']),
      { items: [mappedBitcoin] },
      120,
    );
  });

  it('uses the same cache key for the same coin set in different orders', async () => {
    selectedCoinsService.getSelectedCoins.mockResolvedValue({
      items: [
        selectedBitcoin,
        {
          id: 2,
          coingeckoId: 'ethereum',
          symbol: 'ETH',
          name: 'Ethereum',
        },
      ],
    });
    safeCacheService.get.mockResolvedValue({ items: [] });

    await marketService.getMarketData(userId);

    expect(safeCacheService.get).toHaveBeenCalledWith(
      buildMarketCacheKey(['bitcoin', 'ethereum']),
    );
  });

  it('does not cache provider errors', async () => {
    selectedCoinsService.getSelectedCoins.mockResolvedValue({
      items: [selectedBitcoin],
    });
    coinGeckoClient.fetchMarkets.mockRejectedValue(
      new GatewayTimeoutException('Market data provider request timed out'),
    );

    await expect(marketService.getMarketData(userId)).rejects.toBeInstanceOf(
      GatewayTimeoutException,
    );
    expect(safeCacheService.set).not.toHaveBeenCalled();
  });

  it('falls back to CoinGecko when cache read returns no value', async () => {
    selectedCoinsService.getSelectedCoins.mockResolvedValue({
      items: [selectedBitcoin],
    });
    safeCacheService.get.mockResolvedValue(undefined);
    coinGeckoClient.fetchMarkets.mockResolvedValue([
      {
        id: 'bitcoin',
        symbol: 'btc',
        name: 'Bitcoin',
        image: null,
        current_price: 1,
        market_cap: 1,
        market_cap_rank: 1,
        total_volume: 1,
        high_24h: 1,
        low_24h: 1,
        price_change_24h: 1,
        price_change_percentage_24h: 1,
        last_updated: '2026-06-15T06:11:30.617Z',
      },
    ]);

    const result = await marketService.getMarketData(userId);

    expect(result.items).toHaveLength(1);
    expect(coinGeckoClient.fetchMarkets).toHaveBeenCalled();
  });

  it('maps external snake_case fields to internal camelCase DTOs', async () => {
    selectedCoinsService.getSelectedCoins.mockResolvedValue({
      items: [
        {
          id: 1,
          coingeckoId: 'bitcoin',
          symbol: 'BTC',
          name: 'Bitcoin',
        },
      ],
    });
    coinGeckoClient.fetchMarkets.mockResolvedValue([
      {
        id: 'bitcoin',
        symbol: 'btc',
        name: 'Bitcoin',
        image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
        current_price: 65823,
        market_cap: 1319912956634,
        market_cap_rank: 1,
        total_volume: 25204772698,
        high_24h: 65893,
        low_24h: 63663,
        price_change_24h: 1395.9,
        price_change_percentage_24h: 2.17,
        last_updated: '2026-06-15T06:11:30.617Z',
      },
    ]);

    const result = await marketService.getMarketData(userId);

    expect(coinGeckoClient.fetchMarkets).toHaveBeenCalledWith(['bitcoin']);
    expect(result.items).toEqual([
      {
        id: 'bitcoin',
        symbol: 'BTC',
        name: 'Bitcoin',
        imageUrl:
          'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
        currentPrice: 65823,
        marketCap: 1319912956634,
        marketCapRank: 1,
        totalVolume: 25204772698,
        high24h: 65893,
        low24h: 63663,
        priceChange24h: 1395.9,
        changePercentage24h: 2.17,
        lastUpdated: '2026-06-15T06:11:30.617Z',
      },
    ]);
    expect(result.items[0]).not.toHaveProperty('current_price');
    expect(result.items[0]).not.toHaveProperty('market_cap');
  });

  it('handles null optional numeric fields safely', async () => {
    selectedCoinsService.getSelectedCoins.mockResolvedValue({
      items: [
        {
          id: 1,
          coingeckoId: 'bitcoin',
          symbol: 'BTC',
          name: 'Bitcoin',
        },
      ],
    });
    coinGeckoClient.fetchMarkets.mockResolvedValue([
      {
        id: 'bitcoin',
        symbol: 'btc',
        name: 'Bitcoin',
        image: null,
        current_price: null,
        market_cap: null,
        market_cap_rank: null,
        total_volume: null,
        high_24h: null,
        low_24h: null,
        price_change_24h: null,
        price_change_percentage_24h: null,
        last_updated: null,
      },
    ]);

    const result = await marketService.getMarketData(userId);

    expect(result.items[0]).toEqual({
      id: 'bitcoin',
      symbol: 'BTC',
      name: 'Bitcoin',
      imageUrl: null,
      currentPrice: null,
      marketCap: null,
      marketCapRank: null,
      totalVolume: null,
      high24h: null,
      low24h: null,
      priceChange24h: null,
      changePercentage24h: null,
      lastUpdated: null,
    });
  });

  it('omits coins missing from the CoinGecko response', async () => {
    selectedCoinsService.getSelectedCoins.mockResolvedValue({
      items: [
        {
          id: 1,
          coingeckoId: 'bitcoin',
          symbol: 'BTC',
          name: 'Bitcoin',
        },
        {
          id: 2,
          coingeckoId: 'ethereum',
          symbol: 'ETH',
          name: 'Ethereum',
        },
      ],
    });
    coinGeckoClient.fetchMarkets.mockResolvedValue([
      {
        id: 'bitcoin',
        symbol: 'btc',
        name: 'Bitcoin',
        image: null,
        current_price: 65823,
        market_cap: 1,
        market_cap_rank: 1,
        total_volume: 1,
        high_24h: 1,
        low_24h: 1,
        price_change_24h: 1,
        price_change_percentage_24h: 1,
        last_updated: '2026-06-15T06:11:30.617Z',
      },
    ]);

    const result = await marketService.getMarketData(userId);

    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe('bitcoin');
  });

  it('sorts results alphabetically by supported coin name', async () => {
    selectedCoinsService.getSelectedCoins.mockResolvedValue({
      items: [
        {
          id: 1,
          coingeckoId: 'bitcoin',
          symbol: 'BTC',
          name: 'Bitcoin',
        },
        {
          id: 2,
          coingeckoId: 'ethereum',
          symbol: 'ETH',
          name: 'Ethereum',
        },
      ],
    });
    coinGeckoClient.fetchMarkets.mockResolvedValue([
      {
        id: 'ethereum',
        symbol: 'eth',
        name: 'Ethereum',
        image: null,
        current_price: 1,
        market_cap: 1,
        market_cap_rank: 2,
        total_volume: 1,
        high_24h: 1,
        low_24h: 1,
        price_change_24h: 1,
        price_change_percentage_24h: 1,
        last_updated: '2026-06-15T06:11:30.617Z',
      },
      {
        id: 'bitcoin',
        symbol: 'btc',
        name: 'Bitcoin',
        image: null,
        current_price: 2,
        market_cap: 2,
        market_cap_rank: 1,
        total_volume: 2,
        high_24h: 2,
        low_24h: 2,
        price_change_24h: 2,
        price_change_percentage_24h: 2,
        last_updated: '2026-06-15T06:11:30.617Z',
      },
    ]);

    const result = await marketService.getMarketData(userId);

    expect(result.items.map((item) => item.name)).toEqual([
      'Bitcoin',
      'Ethereum',
    ]);
  });

  it('propagates safe upstream errors from the client', async () => {
    selectedCoinsService.getSelectedCoins.mockResolvedValue({
      items: [
        {
          id: 1,
          coingeckoId: 'bitcoin',
          symbol: 'BTC',
          name: 'Bitcoin',
        },
      ],
    });
    coinGeckoClient.fetchMarkets.mockRejectedValue(
      new GatewayTimeoutException('Market data provider request timed out'),
    );

    await expect(marketService.getMarketData(userId)).rejects.toBeInstanceOf(
      GatewayTimeoutException,
    );
  });

  it('propagates authentication and rate-limit errors safely', async () => {
    selectedCoinsService.getSelectedCoins.mockResolvedValue({
      items: [
        {
          id: 1,
          coingeckoId: 'bitcoin',
          symbol: 'BTC',
          name: 'Bitcoin',
        },
      ],
    });
    coinGeckoClient.fetchMarkets.mockRejectedValue(
      new BadGatewayException('Market data provider authentication failed'),
    );

    await expect(marketService.getMarketData(userId)).rejects.toBeInstanceOf(
      BadGatewayException,
    );

    coinGeckoClient.fetchMarkets.mockRejectedValue(
      new ServiceUnavailableException(
        'Market data provider is temporarily unavailable',
      ),
    );

    await expect(marketService.getMarketData(userId)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
