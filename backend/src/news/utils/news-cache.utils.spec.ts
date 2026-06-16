import { buildNewsCacheKey } from './news-cache.utils';

describe('news cache utils', () => {
  it('builds identical keys for the same symbol set in different orders', () => {
    const first = buildNewsCacheKey(['ETH', 'BTC'], 5);
    const second = buildNewsCacheKey(['BTC', 'ETH'], 5);

    expect(first).toBe('news:BTC,ETH:limit=5:page=first');
    expect(second).toBe(first);
  });

  it('varies the key by limit', () => {
    const limitFive = buildNewsCacheKey(['BTC'], 5);
    const limitTen = buildNewsCacheKey(['BTC'], 10);

    expect(limitFive).not.toBe(limitTen);
  });

  it('varies the key by page token', () => {
    const firstPage = buildNewsCacheKey(['BTC'], 5);
    const secondPage = buildNewsCacheKey(['BTC'], 5, 'page-token');

    expect(firstPage).not.toBe(secondPage);
  });
});
