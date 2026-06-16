import { buildMarketCacheKey } from './market-cache.utils';

describe('market cache utils', () => {
  it('builds identical fresh keys for the same coin set in different orders', () => {
    const first = buildMarketCacheKey(['ethereum', 'bitcoin'], 'fresh');
    const second = buildMarketCacheKey(['bitcoin', 'ethereum'], 'fresh');

    expect(first).toBe('market:fresh:usd:bitcoin,ethereum');
    expect(second).toBe(first);
  });

  it('builds distinct fresh and stale keys for the same coin set', () => {
    const fresh = buildMarketCacheKey(['bitcoin'], 'fresh');
    const stale = buildMarketCacheKey(['bitcoin'], 'stale');

    expect(fresh).toBe('market:fresh:usd:bitcoin');
    expect(stale).toBe('market:stale:usd:bitcoin');
    expect(fresh).not.toBe(stale);
  });
});
