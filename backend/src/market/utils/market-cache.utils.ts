export type MarketCacheLayer = 'fresh' | 'stale';

export function buildMarketCacheKey(
  coingeckoIds: string[],
  layer: MarketCacheLayer,
): string {
  const sortedIds = [...coingeckoIds].sort();

  return `market:${layer}:usd:${sortedIds.join(',')}`;
}
