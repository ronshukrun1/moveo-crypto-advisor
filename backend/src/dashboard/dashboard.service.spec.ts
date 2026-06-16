import {
  ConflictException,
  GatewayTimeoutException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { InvestorProfile } from '../preferences/enums/investor-profile.enum';
import { InsightsService } from '../insights/insights.service';
import { MarketService } from '../market/market.service';
import { MemesService } from '../memes/memes.service';
import { NewsService } from '../news/news.service';
import { PreferencesService } from '../preferences/preferences.service';
import { SelectedCoinsService } from '../selected-coins/selected-coins.service';
import { UsersService } from '../users/users.service';
import { DASHBOARD_SECTION_MESSAGES } from './constants/dashboard.constants';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let dashboardService: DashboardService;
  let usersService: { findById: jest.Mock };
  let preferencesService: { getPreferences: jest.Mock };
  let selectedCoinsService: { getSelectedCoins: jest.Mock };
  let marketService: {
    getMarketData: jest.Mock;
    getMarketDataWithMetadata: jest.Mock;
  };
  let newsService: { getNews: jest.Mock; getNewsWithMetadata: jest.Mock };
  let insightsService: {
    generateAndPersistFromData: jest.Mock;
    tryGetValidStoredDailyInsight: jest.Mock;
  };
  let memesService: {
    generateAndPersistFromMarketData: jest.Mock;
    tryGetValidStoredDailyMeme: jest.Mock;
  };

  const userId = 1;

  const user = {
    id: userId,
    name: 'Ron',
    email: 'ron@example.com',
    passwordHash: 'hashed',
    onboardingCompleted: true,
  };

  const preferences = {
    id: 1,
    investorProfile: InvestorProfile.LONG_TERM_HOLDER,
    showMarketPrices: true,
    showNews: true,
    showAiInsight: true,
    showMeme: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const selectedCoins = {
    items: [
      { id: 1, coingeckoId: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
      { id: 2, coingeckoId: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
    ],
  };

  const marketData = {
    items: [
      {
        id: 'bitcoin',
        symbol: 'BTC',
        name: 'Bitcoin',
        imageUrl: null,
        currentPrice: 65823,
        marketCap: null,
        marketCapRank: null,
        totalVolume: null,
        high24h: null,
        low24h: null,
        priceChange24h: null,
        changePercentage24h: 2.17,
        lastUpdated: null,
      },
    ],
  };

  const newsData = {
    items: [
      {
        id: 'article-1',
        title: 'Bitcoin market update',
        description: 'Short description',
        url: 'https://example.com/article-1',
        imageUrl: null,
        sourceName: null,
        sourceUrl: null,
        creator: null,
        relatedCoins: ['BTC'],
        publishedAt: '2026-06-14T19:30:38.000Z',
      },
    ],
    nextPage: null,
  };

  const insightData = {
    title: 'Daily Market Context',
    insight: 'First sentence. Second sentence.',
    disclaimer: 'For educational purposes only. Not financial advice.',
    generatedAt: '2026-06-16T10:00:00.000Z',
  };

  const memeData = {
    imageUrl: 'https://i.imgflip.com/example.jpg',
    pageUrl: 'https://imgflip.com/i/example',
    textTop: 'BTC moved 2.2% in 24 hours',
    textBottom: 'Me checking the dashboard again',
    generatedAt: '2026-06-16T10:00:00.000Z',
  };

  beforeEach(async () => {
    usersService = { findById: jest.fn() };
    preferencesService = { getPreferences: jest.fn() };
    selectedCoinsService = { getSelectedCoins: jest.fn() };
    marketService = {
      getMarketData: jest.fn(),
      getMarketDataWithMetadata: jest.fn(),
    };
    newsService = { getNews: jest.fn(), getNewsWithMetadata: jest.fn() };
    insightsService = {
      generateAndPersistFromData: jest.fn(),
      tryGetValidStoredDailyInsight: jest.fn(),
    };
    memesService = {
      generateAndPersistFromMarketData: jest.fn(),
      tryGetValidStoredDailyMeme: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: UsersService, useValue: usersService },
        { provide: PreferencesService, useValue: preferencesService },
        { provide: SelectedCoinsService, useValue: selectedCoinsService },
        { provide: MarketService, useValue: marketService },
        { provide: NewsService, useValue: newsService },
        { provide: InsightsService, useValue: insightsService },
        { provide: MemesService, useValue: memesService },
      ],
    }).compile();

    dashboardService = module.get(DashboardService);
  });

  function mockBaseDependencies(): void {
    usersService.findById.mockResolvedValue(user);
    preferencesService.getPreferences.mockResolvedValue(preferences);
    selectedCoinsService.getSelectedCoins.mockResolvedValue(selectedCoins);
    marketService.getMarketDataWithMetadata.mockResolvedValue({
      data: marketData,
      isStale: false,
    });
    newsService.getNewsWithMetadata.mockResolvedValue({
      data: newsData,
      isStale: false,
    });
    insightsService.tryGetValidStoredDailyInsight.mockResolvedValue(null);
    memesService.tryGetValidStoredDailyMeme.mockResolvedValue(null);
    insightsService.generateAndPersistFromData.mockResolvedValue(insightData);
    memesService.generateAndPersistFromMarketData.mockResolvedValue(memeData);
  }

  it('returns 409 when onboarding is incomplete', async () => {
    usersService.findById.mockResolvedValue({
      ...user,
      onboardingCompleted: false,
    });

    await expect(dashboardService.getDashboard(userId)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(preferencesService.getPreferences).not.toHaveBeenCalled();
  });

  it('returns 404 when the user no longer exists', async () => {
    usersService.findById.mockRejectedValue(
      new NotFoundException('User not found'),
    );

    await expect(dashboardService.getDashboard(userId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('loads market and news once and passes shared data to insight and meme', async () => {
    mockBaseDependencies();

    await dashboardService.getDashboard(userId);

    expect(marketService.getMarketDataWithMetadata).toHaveBeenCalledTimes(1);
    expect(newsService.getNewsWithMetadata).toHaveBeenCalledTimes(1);
    expect(newsService.getNewsWithMetadata).toHaveBeenCalledWith(userId, {
      limit: 5,
    });
    expect(insightsService.generateAndPersistFromData).toHaveBeenCalledWith(
      userId,
      {
        investorProfile: InvestorProfile.LONG_TERM_HOLDER,
        selectedCoins: selectedCoins.items,
        marketItems: marketData.items,
        newsItems: newsData.items,
      },
    );
    expect(memesService.generateAndPersistFromMarketData).toHaveBeenCalledWith(
      userId,
      {
        selectedCoins: selectedCoins.items,
        marketItems: marketData.items,
      },
    );
  });

  it('does not load market or news when all dependent sections are disabled', async () => {
    mockBaseDependencies();
    preferencesService.getPreferences.mockResolvedValue({
      ...preferences,
      showMarketPrices: false,
      showNews: false,
      showAiInsight: false,
      showMeme: false,
    });

    const result = await dashboardService.getDashboard(userId);

    expect(marketService.getMarketDataWithMetadata).not.toHaveBeenCalled();
    expect(newsService.getNewsWithMetadata).not.toHaveBeenCalled();
    expect(insightsService.generateAndPersistFromData).not.toHaveBeenCalled();
    expect(
      memesService.generateAndPersistFromMarketData,
    ).not.toHaveBeenCalled();
    expect(result.market).toEqual({ status: 'disabled' });
    expect(result.news).toEqual({ status: 'disabled' });
    expect(result.insight).toEqual({ status: 'disabled' });
    expect(result.meme).toEqual({ status: 'disabled' });
  });

  it('loads market once for insight while keeping the market section disabled', async () => {
    mockBaseDependencies();
    preferencesService.getPreferences.mockResolvedValue({
      ...preferences,
      showMarketPrices: false,
      showNews: false,
      showAiInsight: true,
      showMeme: false,
    });

    const result = await dashboardService.getDashboard(userId);

    expect(marketService.getMarketDataWithMetadata).toHaveBeenCalledTimes(1);
    expect(newsService.getNewsWithMetadata).toHaveBeenCalledTimes(1);
    expect(result.market).toEqual({ status: 'disabled' });
    expect(result.news).toEqual({ status: 'disabled' });
    expect(result.insight.status).toBe('available');
  });

  it('loads news once for insight while keeping the news section disabled', async () => {
    mockBaseDependencies();
    preferencesService.getPreferences.mockResolvedValue({
      ...preferences,
      showMarketPrices: false,
      showNews: false,
      showAiInsight: true,
      showMeme: false,
    });

    const result = await dashboardService.getDashboard(userId);

    expect(newsService.getNewsWithMetadata).toHaveBeenCalledTimes(1);
    expect(result.news).toEqual({ status: 'disabled' });
    expect(result.insight.status).toBe('available');
  });

  it('returns available sections when all enabled services succeed', async () => {
    mockBaseDependencies();

    const result = await dashboardService.getDashboard(userId);

    expect(result.market).toEqual({
      status: 'available',
      isStale: false,
      items: marketData.items,
    });
    expect(result.news).toEqual({
      status: 'available',
      isStale: false,
      items: newsData.items,
      nextPage: null,
    });
    expect(result.insight).toEqual({ status: 'available', data: insightData });
    expect(result.meme).toEqual({ status: 'available', data: memeData });
    expect(result.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('returns unavailable market and dependent sections when shared market fails', async () => {
    mockBaseDependencies();
    marketService.getMarketDataWithMetadata.mockRejectedValue(
      new GatewayTimeoutException('Market data provider request timed out'),
    );

    const result = await dashboardService.getDashboard(userId);

    expect(marketService.getMarketDataWithMetadata).toHaveBeenCalledTimes(1);
    expect(result.market).toEqual({
      status: 'unavailable',
      message: DASHBOARD_SECTION_MESSAGES.market,
    });
    expect(result.news.status).toBe('available');
    expect(result.insight.status).toBe('unavailable');
    expect(result.meme.status).toBe('unavailable');
    expect(insightsService.generateAndPersistFromData).not.toHaveBeenCalled();
    expect(
      memesService.generateAndPersistFromMarketData,
    ).not.toHaveBeenCalled();
  });

  it('returns unavailable news and insight when shared news fails', async () => {
    mockBaseDependencies();
    newsService.getNewsWithMetadata.mockRejectedValue(
      new Error('News provider failed'),
    );

    const result = await dashboardService.getDashboard(userId);

    expect(newsService.getNewsWithMetadata).toHaveBeenCalledTimes(1);
    expect(result.news).toEqual({
      status: 'unavailable',
      message: DASHBOARD_SECTION_MESSAGES.news,
    });
    expect(result.market.status).toBe('available');
    expect(result.insight.status).toBe('unavailable');
    expect(result.meme.status).toBe('available');
    expect(insightsService.generateAndPersistFromData).not.toHaveBeenCalled();
  });

  it('returns unavailable insight only when OpenRouter generation fails', async () => {
    mockBaseDependencies();
    insightsService.generateAndPersistFromData.mockRejectedValue(
      new Error('OpenRouter failed'),
    );

    const result = await dashboardService.getDashboard(userId);

    expect(result.insight).toEqual({
      status: 'unavailable',
      message: DASHBOARD_SECTION_MESSAGES.insight,
    });
    expect(result.market.status).toBe('available');
    expect(result.meme.status).toBe('available');
  });

  it('returns unavailable meme only when Imgflip generation fails', async () => {
    mockBaseDependencies();
    memesService.generateAndPersistFromMarketData.mockRejectedValue(
      new Error('Imgflip failed'),
    );

    const result = await dashboardService.getDashboard(userId);

    expect(result.meme).toEqual({
      status: 'unavailable',
      message: DASHBOARD_SECTION_MESSAGES.meme,
    });
    expect(result.market.status).toBe('available');
    expect(result.insight.status).toBe('available');
  });

  it('reuses stored insight and meme without calling generation', async () => {
    mockBaseDependencies();
    insightsService.tryGetValidStoredDailyInsight.mockResolvedValue(
      insightData,
    );
    memesService.tryGetValidStoredDailyMeme.mockResolvedValue(memeData);

    const result = await dashboardService.getDashboard(userId);

    expect(insightsService.generateAndPersistFromData).not.toHaveBeenCalled();
    expect(
      memesService.generateAndPersistFromMarketData,
    ).not.toHaveBeenCalled();
    expect(result.insight).toEqual({ status: 'available', data: insightData });
    expect(result.meme).toEqual({ status: 'available', data: memeData });
  });

  it('marks market and news sections as stale when metadata reports stale data', async () => {
    mockBaseDependencies();
    marketService.getMarketDataWithMetadata.mockResolvedValue({
      data: marketData,
      isStale: true,
    });
    newsService.getNewsWithMetadata.mockResolvedValue({
      data: newsData,
      isStale: true,
    });

    const result = await dashboardService.getDashboard(userId);

    expect(result.market).toEqual({
      status: 'available',
      isStale: true,
      items: marketData.items,
    });
    expect(result.news).toEqual({
      status: 'available',
      isStale: true,
      items: newsData.items,
      nextPage: null,
    });
    expect(insightsService.generateAndPersistFromData).toHaveBeenCalled();
    expect(memesService.generateAndPersistFromMarketData).toHaveBeenCalled();
  });

  it('does not expose sensitive fields in the dashboard response', async () => {
    mockBaseDependencies();

    const result = await dashboardService.getDashboard(userId);

    expect(JSON.stringify(result)).not.toContain('passwordHash');
    expect(result.user).not.toHaveProperty('email');
  });
});
