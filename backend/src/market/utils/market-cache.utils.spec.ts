import { buildMarketCacheKey } from './market-cache.utils';

describe('market cache utils', () => {
  it('builds identical keys for the same coin set in different orders', () => {
    const first = buildMarketCacheKey(['ethereum', 'bitcoin']);
    const second = buildMarketCacheKey(['bitcoin', 'ethereum']);

    expect(first).toBe('market:usd:bitcoin,ethereum');
    expect(second).toBe(first);
  });
});
