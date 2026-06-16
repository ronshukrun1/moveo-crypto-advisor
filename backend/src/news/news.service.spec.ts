import {
  BadGatewayException,
  GatewayTimeoutException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NewsDataClient } from './news-data.client';
import { NewsService } from './news.service';
import { SelectedCoinsService } from '../selected-coins/selected-coins.service';
import { SafeCacheService } from '../cache/safe-cache.service';
import {
  deduplicateNewsArticles,
  mapNewsArticles,
  processNewsArticles,
  sortNewsArticlesByPublishedAt,
} from './utils/news-article-processing';
import { buildNewsCacheKey } from './utils/news-cache.utils';
import { toSelectedCoinsForRelevance } from './utils/news-relevance-filter';

describe('NewsService', () => {
  let newsService: NewsService;
  let selectedCoinsService: { getSelectedCoins: jest.Mock };
  let newsDataClient: { fetchNews: jest.Mock };
  let safeCacheService: { get: jest.Mock; set: jest.Mock };

  const userId = 1;

  const articleOne = {
    article_id: 'article-1',
    link: 'https://example.com/article-1',
    title: 'Bitcoin market update',
    description: 'Short description',
    keywords: ['bitcoin'],
    creator: ['Author Name'],
    coin: ['btc'],
    language: 'english',
    pubDate: '2026-06-14 19:30:38',
    image_url: 'https://example.com/image.jpg',
    source_id: 'source-1',
    source_name: 'Source Name',
    source_url: 'https://example.com',
  };

  const articleTwo = {
    ...articleOne,
    article_id: 'article-2',
    link: 'https://example.com/article-2',
    title: 'Ethereum update',
    pubDate: '2026-06-15 10:00:00',
    image_url: null,
    description: null,
    creator: null,
    coin: ['eth'],
  };

  beforeEach(async () => {
    selectedCoinsService = {
      getSelectedCoins: jest.fn(),
    };
    newsDataClient = {
      fetchNews: jest.fn(),
    };
    safeCacheService = {
      get: jest.fn().mockResolvedValue(undefined),
      set: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NewsService,
        {
          provide: SelectedCoinsService,
          useValue: selectedCoinsService,
        },
        {
          provide: NewsDataClient,
          useValue: newsDataClient,
        },
        {
          provide: SafeCacheService,
          useValue: safeCacheService,
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn((key: string) => {
              if (key === 'NEWS_CACHE_TTL_SECONDS') {
                return 300;
              }

              if (key === 'NEWS_STALE_TTL_SECONDS') {
                return 3600;
              }

              throw new Error(`Unexpected config key: ${key}`);
            }),
          },
        },
      ],
    }).compile();

    newsService = module.get(NewsService);
  });

  it('returns empty results without calling NewsData when no coins are selected', async () => {
    selectedCoinsService.getSelectedCoins.mockResolvedValue({ items: [] });

    const result = await newsService.getNews(userId, {});

    expect(result).toEqual({ items: [], nextPage: null });
    expect(newsDataClient.fetchNews).not.toHaveBeenCalled();
    expect(safeCacheService.get).not.toHaveBeenCalled();
    expect(safeCacheService.set).not.toHaveBeenCalled();
  });

  it('returns cached news without calling NewsData on a cache hit', async () => {
    selectedCoinsService.getSelectedCoins.mockResolvedValue({
      items: [
        { id: 1, coingeckoId: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
      ],
    });
    safeCacheService.get.mockResolvedValue({
      items: [
        {
          id: 'article-1',
          title: 'Bitcoin market update',
          description: 'Short description',
          url: 'https://example.com/article-1',
          imageUrl: 'https://example.com/image.jpg',
          sourceName: 'Source Name',
          sourceUrl: 'https://example.com',
          creator: ['Author Name'],
          relatedCoins: ['BTC'],
          publishedAt: '2026-06-14T19:30:38.000Z',
        },
      ],
      nextPage: 'next-token',
    });

    const result = await newsService.getNews(userId, { limit: 5 });

    expect(result.nextPage).toBe('next-token');
    expect(newsDataClient.fetchNews).not.toHaveBeenCalled();
    expect(safeCacheService.set).not.toHaveBeenCalled();
  });

  it('stores the final filtered response on a cache miss', async () => {
    selectedCoinsService.getSelectedCoins.mockResolvedValue({
      items: [
        { id: 1, coingeckoId: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
      ],
    });
    newsDataClient.fetchNews.mockResolvedValue({
      status: 'success',
      totalResults: 1,
      results: [articleOne],
      nextPage: 'next-token',
    });

    await newsService.getNews(userId, { limit: 5 });

    expect(safeCacheService.set).toHaveBeenCalledWith(
      buildNewsCacheKey(['BTC'], 5, undefined, 'fresh'),
      expect.objectContaining({
        nextPage: 'next-token',
        items: expect.arrayContaining([
          expect.objectContaining({ id: 'article-1' }),
        ]) as unknown,
      }),
      300,
    );
    expect(safeCacheService.set).toHaveBeenCalledWith(
      buildNewsCacheKey(['BTC'], 5, undefined, 'stale'),
      expect.objectContaining({
        nextPage: 'next-token',
      }),
      3600,
    );
  });

  it('uses different cache keys for different limits and pages', async () => {
    selectedCoinsService.getSelectedCoins.mockResolvedValue({
      items: [
        { id: 1, coingeckoId: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
      ],
    });
    newsDataClient.fetchNews.mockResolvedValue({
      status: 'success',
      totalResults: 1,
      results: [articleOne],
      nextPage: null,
    });

    await newsService.getNews(userId, { limit: 5 });
    await newsService.getNews(userId, { limit: 10 });
    await newsService.getNews(userId, { limit: 5, page: 'page-token' });

    expect(safeCacheService.get).toHaveBeenNthCalledWith(
      1,
      buildNewsCacheKey(['BTC'], 5, undefined, 'fresh'),
    );
    expect(safeCacheService.get).toHaveBeenNthCalledWith(
      2,
      buildNewsCacheKey(['BTC'], 10, undefined, 'fresh'),
    );
    expect(safeCacheService.get).toHaveBeenNthCalledWith(
      3,
      buildNewsCacheKey(['BTC'], 5, 'page-token', 'fresh'),
    );
  });

  it('does not cache provider errors when no stale entry exists', async () => {
    selectedCoinsService.getSelectedCoins.mockResolvedValue({
      items: [
        { id: 1, coingeckoId: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
      ],
    });
    newsDataClient.fetchNews.mockRejectedValue(
      new GatewayTimeoutException('News request timed out'),
    );

    await expect(newsService.getNews(userId, {})).rejects.toBeInstanceOf(
      GatewayTimeoutException,
    );
    expect(safeCacheService.set).not.toHaveBeenCalled();
  });

  it('returns stale data after a provider failure when stale cache exists', async () => {
    const cachedNews = {
      items: [
        {
          id: 'article-1',
          title: 'Bitcoin market update',
          description: 'Short description',
          url: 'https://example.com/article-1',
          imageUrl: 'https://example.com/image.jpg',
          sourceName: 'Source Name',
          sourceUrl: 'https://example.com',
          creator: ['Author Name'],
          relatedCoins: ['BTC'],
          publishedAt: '2026-06-14T19:30:38.000Z',
        },
      ],
      nextPage: 'next-token',
    };
    selectedCoinsService.getSelectedCoins.mockResolvedValue({
      items: [
        { id: 1, coingeckoId: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
      ],
    });
    safeCacheService.get.mockImplementation((key: string) => {
      if (key === buildNewsCacheKey(['BTC'], 5, undefined, 'stale')) {
        return Promise.resolve(cachedNews);
      }

      return Promise.resolve(undefined);
    });
    newsDataClient.fetchNews.mockRejectedValue(
      new GatewayTimeoutException('News request timed out'),
    );

    const result = await newsService.getNewsWithMetadata(userId, { limit: 5 });

    expect(result).toEqual({ data: cachedNews, isStale: true });
    expect(newsDataClient.fetchNews).toHaveBeenCalled();
    expect(safeCacheService.set).not.toHaveBeenCalled();
  });

  it('returns fresh metadata on a cache hit', async () => {
    const cachedNews = {
      items: [],
      nextPage: null,
    };
    selectedCoinsService.getSelectedCoins.mockResolvedValue({
      items: [
        { id: 1, coingeckoId: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
      ],
    });
    safeCacheService.get.mockResolvedValue(cachedNews);

    const result = await newsService.getNewsWithMetadata(userId, { limit: 5 });

    expect(result).toEqual({ data: cachedNews, isStale: false });
  });

  it('caches an empty successful provider response in fresh and stale layers', async () => {
    selectedCoinsService.getSelectedCoins.mockResolvedValue({
      items: [
        { id: 1, coingeckoId: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
      ],
    });
    newsDataClient.fetchNews.mockResolvedValue({
      status: 'success',
      totalResults: 0,
      results: [],
      nextPage: null,
    });

    const result = await newsService.getNews(userId, { limit: 5 });

    expect(result).toEqual({ items: [], nextPage: null });
    expect(safeCacheService.set).toHaveBeenCalledWith(
      buildNewsCacheKey(['BTC'], 5, undefined, 'fresh'),
      { items: [], nextPage: null },
      300,
    );
    expect(safeCacheService.set).toHaveBeenCalledWith(
      buildNewsCacheKey(['BTC'], 5, undefined, 'stale'),
      { items: [], nextPage: null },
      3600,
    );
  });

  it('forwards selected symbols, limit, and pagination token', async () => {
    selectedCoinsService.getSelectedCoins.mockResolvedValue({
      items: [
        { id: 1, coingeckoId: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
        { id: 2, coingeckoId: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
      ],
    });
    newsDataClient.fetchNews.mockResolvedValue({
      status: 'success',
      totalResults: 1,
      results: [articleOne],
      nextPage: 'next-token',
    });

    const result = await newsService.getNews(userId, {
      limit: 3,
      page: 'page-token',
    });

    expect(newsDataClient.fetchNews).toHaveBeenCalledWith({
      symbols: ['BTC', 'ETH'],
      limit: 3,
      page: 'page-token',
    });
    expect(result.nextPage).toBe('next-token');
  });

  it('maps external fields to camelCase and handles missing optional fields', async () => {
    selectedCoinsService.getSelectedCoins.mockResolvedValue({
      items: [
        { id: 2, coingeckoId: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
      ],
    });
    newsDataClient.fetchNews.mockResolvedValue({
      status: 'success',
      totalResults: 1,
      results: [articleTwo],
      nextPage: null,
    });

    const result = await newsService.getNews(userId, {});

    expect(result.items[0]).toEqual({
      id: 'article-2',
      title: 'Ethereum update',
      description: null,
      url: 'https://example.com/article-2',
      imageUrl: null,
      sourceName: 'Source Name',
      sourceUrl: 'https://example.com',
      creator: null,
      relatedCoins: ['ETH'],
      publishedAt: '2026-06-15T10:00:00.000Z',
    });
    expect(result.items[0]).not.toHaveProperty('image_url');
    expect(result.items[0]).not.toHaveProperty('content');
    expect(result.items[0]).not.toHaveProperty('sentiment');
  });

  it('filters out loosely tagged irrelevant articles', async () => {
    selectedCoinsService.getSelectedCoins.mockResolvedValue({
      items: [
        { id: 1, coingeckoId: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
        { id: 2, coingeckoId: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
      ],
    });
    newsDataClient.fetchNews.mockResolvedValue({
      status: 'success',
      totalResults: 3,
      results: [
        articleOne,
        articleTwo,
        {
          ...articleTwo,
          article_id: 'article-3',
          link: 'https://example.com/article-3',
          title: 'Gold prices surge',
          description: 'Precious metals rallied.',
          coin: ['BTC'],
        },
      ],
      nextPage: 'next-token',
    });

    const result = await newsService.getNews(userId, { limit: 5 });

    expect(result.items).toHaveLength(2);
    expect(result.items.map((item) => item.id)).toEqual([
      'article-2',
      'article-1',
    ]);
    expect(result.nextPage).toBe('next-token');
  });

  it('propagates safe upstream errors from the client', async () => {
    selectedCoinsService.getSelectedCoins.mockResolvedValue({
      items: [
        { id: 1, coingeckoId: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
      ],
    });
    newsDataClient.fetchNews.mockRejectedValue(
      new GatewayTimeoutException('News request timed out'),
    );

    await expect(newsService.getNews(userId, {})).rejects.toBeInstanceOf(
      GatewayTimeoutException,
    );

    newsDataClient.fetchNews.mockRejectedValue(
      new BadGatewayException('Unable to retrieve news'),
    );

    await expect(newsService.getNews(userId, {})).rejects.toBeInstanceOf(
      BadGatewayException,
    );

    newsDataClient.fetchNews.mockRejectedValue(
      new ServiceUnavailableException(
        'News service is temporarily unavailable',
      ),
    );

    await expect(newsService.getNews(userId, {})).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});

describe('news article processing', () => {
  const olderArticle = {
    article_id: 'older',
    link: 'https://example.com/older',
    title: 'Older',
    description: null,
    keywords: null,
    creator: null,
    coin: null,
    language: null,
    pubDate: '2026-06-14 10:00:00',
    image_url: null,
    source_id: null,
    source_name: null,
    source_url: null,
  };

  const newerArticle = {
    ...olderArticle,
    article_id: 'newer',
    link: 'https://example.com/newer',
    title: 'Newer',
    pubDate: '2026-06-15 10:00:00',
  };

  it('removes duplicate article IDs and URLs', () => {
    const deduplicated = deduplicateNewsArticles([
      olderArticle,
      { ...olderArticle, title: 'Duplicate ID' },
      newerArticle,
      {
        ...newerArticle,
        article_id: 'newer-copy',
        link: 'https://example.com/newer',
      },
    ]);

    expect(deduplicated).toHaveLength(2);
    expect(deduplicated.map((item) => item.article_id)).toEqual([
      'older',
      'newer',
    ]);
  });

  it('sorts articles by publication date descending', () => {
    const sorted = sortNewsArticlesByPublishedAt([olderArticle, newerArticle]);

    expect(sorted.map((item) => item.article_id)).toEqual(['newer', 'older']);
  });

  it('does not expose paid-plan placeholder fields in mapped items', () => {
    const mapped = mapNewsArticles([
      {
        ...newerArticle,
        title: 'Bitcoin market recap',
        coin: ['BTC'],
        content: 'ONLY AVAILABLE IN PAID PLANS',
        sentiment: 'positive',
        ai_tag: 'placeholder',
      } as typeof newerArticle & {
        content: string;
        sentiment: string;
        ai_tag: string;
      },
    ]);

    expect(mapped[0]).not.toHaveProperty('content');
    expect(mapped[0]).not.toHaveProperty('sentiment');
    expect(mapped[0]).not.toHaveProperty('ai_tag');
  });

  it('deduplicates before relevance filtering', () => {
    const selected = toSelectedCoinsForRelevance([
      { coingeckoId: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
    ]);
    const duplicate = {
      ...olderArticle,
      title: 'Bitcoin update',
      coin: ['BTC'],
    };
    const unique = {
      ...newerArticle,
      title: 'Bitcoin rebounds',
      coin: ['BTC'],
    };

    const processed = processNewsArticles(
      [duplicate, { ...duplicate, title: 'Duplicate ID' }, unique],
      selected,
      5,
    );

    expect(processed.items).toHaveLength(2);
    expect(processed.items.map((item) => item.id)).toEqual(['newer', 'older']);
  });

  it('sorts after relevance filtering', () => {
    const selected = toSelectedCoinsForRelevance([
      { coingeckoId: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
    ]);
    const processed = processNewsArticles(
      [
        { ...olderArticle, title: 'Bitcoin update', coin: ['BTC'] },
        { ...newerArticle, title: 'Bitcoin rebounds', coin: ['BTC'] },
      ],
      selected,
      5,
    );

    expect(processed.items.map((item) => item.id)).toEqual(['newer', 'older']);
  });

  it('may return fewer items than the requested limit after filtering', () => {
    const selected = toSelectedCoinsForRelevance([
      { coingeckoId: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
    ]);
    const processed = processNewsArticles(
      [
        { ...newerArticle, title: 'Bitcoin rebounds', coin: ['BTC'] },
        {
          ...olderArticle,
          article_id: 'irrelevant',
          link: 'https://example.com/irrelevant',
          title: 'Gold prices surge',
          coin: ['BTC'],
        },
      ],
      selected,
      5,
    );

    expect(processed.returnedCount).toBe(1);
    expect(processed.items).toHaveLength(1);
    expect(processed.items[0].id).toBe('newer');
  });

  it('keeps the public response shape unchanged after filtering', () => {
    const selected = toSelectedCoinsForRelevance([
      { coingeckoId: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
    ]);
    const processed = processNewsArticles(
      [{ ...newerArticle, title: 'Bitcoin rebounds', coin: ['BTC'] }],
      selected,
      5,
    );

    expect(processed.items[0]).toEqual({
      id: 'newer',
      title: 'Bitcoin rebounds',
      description: null,
      url: 'https://example.com/newer',
      imageUrl: null,
      sourceName: null,
      sourceUrl: null,
      creator: null,
      relatedCoins: ['BTC'],
      publishedAt: '2026-06-15T10:00:00.000Z',
    });
    expect(processed.items[0]).not.toHaveProperty('relevanceScore');
  });
});
