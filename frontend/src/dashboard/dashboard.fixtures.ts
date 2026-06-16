import type { DashboardResponse } from './dashboard.types';

export const mockDashboardResponse: DashboardResponse = {
  user: {
    id: 2,
    name: 'Alex',
    onboardingCompleted: true,
  },
  preferences: {
    investorProfile: 'LONG_TERM_HOLDER',
    showMarketPrices: true,
    showNews: true,
    showAiInsight: true,
    showMeme: true,
  },
  selectedCoins: [
    {
      id: 1,
      coingeckoId: 'bitcoin',
      symbol: 'BTC',
      name: 'Bitcoin',
    },
  ],
  market: {
    status: 'available',
    isStale: false,
    items: [
      {
        id: 'bitcoin',
        symbol: 'BTC',
        name: 'Bitcoin',
        imageUrl: 'https://example.com/btc.png',
        currentPrice: 65823.12,
        marketCap: 1319912956634,
        marketCapRank: 1,
        totalVolume: 25204772698,
        high24h: 65893,
        low24h: 63663,
        priceChange24h: 1395.9,
        changePercentage24h: 2.17,
        lastUpdated: '2026-06-15T06:11:30.617Z',
      },
      {
        id: 'ethereum',
        symbol: 'ETH',
        name: 'Ethereum',
        imageUrl: null,
        currentPrice: 3450.5,
        marketCap: null,
        marketCapRank: 2,
        totalVolume: null,
        high24h: null,
        low24h: null,
        priceChange24h: -42.1,
        changePercentage24h: -1.2,
        lastUpdated: null,
      },
    ],
  },
  news: {
    status: 'available',
    isStale: false,
    nextPage: null,
    items: [
      {
        id: 'news-1',
        title: 'Bitcoin market update',
        description: 'Short summary of the latest market activity.',
        url: 'https://example.com/news/bitcoin',
        imageUrl: null,
        sourceName: 'Crypto Daily',
        sourceUrl: 'https://example.com',
        creator: null,
        relatedCoins: ['BTC'],
        publishedAt: '2026-06-14T19:30:38.000Z',
      },
    ],
  },
  insight: {
    status: 'available',
    data: {
      title: 'Bitcoin and Ethereum Update',
      insight: 'Bitcoin rose 2.2% during the last 24 hours.\nEthereum also moved higher.',
      disclaimer: 'For educational purposes only. Not financial advice.',
      generatedAt: '2026-06-16T10:00:00.000Z',
    },
  },
  meme: {
    status: 'available',
    data: {
      imageUrl: 'https://example.com/meme.jpg',
      pageUrl: 'https://example.com/meme-source',
      textTop: 'BTC moved 2.2% in 24 hours',
      textBottom: 'Me checking the dashboard again',
      generatedAt: '2026-06-16T10:00:00.000Z',
    },
  },
  generatedAt: '2026-06-16T10:00:00.000Z',
};

export function createDashboardResponse(
  overrides: Partial<DashboardResponse> = {},
): DashboardResponse {
  return {
    ...mockDashboardResponse,
    ...overrides,
    market: overrides.market ?? mockDashboardResponse.market,
    news: overrides.news ?? mockDashboardResponse.news,
    insight: overrides.insight ?? mockDashboardResponse.insight,
    meme: overrides.meme ?? mockDashboardResponse.meme,
  };
}
