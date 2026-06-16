export function buildMarketCacheKey(coingeckoIds: string[]): string {
  const sortedIds = [...coingeckoIds].sort();

  return `market:usd:${sortedIds.join(',')}`;
}
