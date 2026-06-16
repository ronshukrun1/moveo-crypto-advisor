import { buildNewsCacheKey } from './news-cache.utils';

describe('news cache utils', () => {
  it('builds identical fresh keys for the same symbol set in different orders', () => {
    const first = buildNewsCacheKey(['ETH', 'BTC'], 5, undefined, 'fresh');
    const second = buildNewsCacheKey(['BTC', 'ETH'], 5, undefined, 'fresh');

    expect(first).toBe('news:v2:fresh:BTC,ETH:limit=5:page=first');
    expect(second).toBe(first);
  });

  it('builds distinct fresh and stale keys for the same query', () => {
    const fresh = buildNewsCacheKey(['BTC'], 5, undefined, 'fresh');
    const stale = buildNewsCacheKey(['BTC'], 5, undefined, 'stale');

    expect(fresh).toBe('news:v2:fresh:BTC:limit=5:page=first');
    expect(stale).toBe('news:v2:stale:BTC:limit=5:page=first');
    expect(fresh).not.toBe(stale);
  });

  it('varies the key by limit', () => {
    const limitFive = buildNewsCacheKey(['BTC'], 5, undefined, 'fresh');
    const limitTen = buildNewsCacheKey(['BTC'], 10, undefined, 'fresh');

    expect(limitFive).not.toBe(limitTen);
  });

  it('varies the key by page token', () => {
    const firstPage = buildNewsCacheKey(['BTC'], 5, undefined, 'fresh');
    const secondPage = buildNewsCacheKey(['BTC'], 5, 'page-token', 'fresh');

    expect(firstPage).not.toBe(secondPage);
  });

  it('uses a cache-key version that prevents reuse of older filtered entries', () => {
    const key = buildNewsCacheKey(['BTC'], 5, undefined, 'fresh');

    expect(key.startsWith('news:v2:')).toBe(true);
    expect(key).not.toBe('news:fresh:BTC:limit=5:page=first');
  });
});
