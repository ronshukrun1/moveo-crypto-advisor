import {
  BadGatewayException,
  BadRequestException,
  GatewayTimeoutException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { InvestorProfile } from '../preferences/enums/investor-profile.enum';
import { PreferencesService } from '../preferences/preferences.service';
import { SelectedCoinsService } from '../selected-coins/selected-coins.service';
import { MarketService } from '../market/market.service';
import { NewsService } from '../news/news.service';
import {
  buildInsightContextHash,
  getUtcDateString,
} from '../common/utils/daily-content.utils';
import * as dailyContentUtils from '../common/utils/daily-content.utils';
import { INSIGHT_DISCLAIMER } from './constants/insight.constants';
import { InsightsService } from './insights.service';
import { DailyInsight } from './entities/daily-insight.entity';
import { OpenRouterClient } from './open-router.client';
import {
  buildInsightUserPrompt,
  buildInsightMessages,
} from './utils/insight-prompt.builder';
import {
  countSentences,
  parseModelInsightContent,
  validateModelInsightOutput,
} from './utils/insight-output.validation';

describe('InsightsService', () => {
  let insightsService: InsightsService;
  let preferencesService: { getPreferences: jest.Mock };
  let selectedCoinsService: { getSelectedCoins: jest.Mock };
  let marketService: { getMarketData: jest.Mock };
  let newsService: { getNews: jest.Mock };
  let openRouterClient: { generateInsightContent: jest.Mock };
  let dailyInsightRepository: {
    findOne: jest.Mock;
    findOneOrFail: jest.Mock;
    upsert: jest.Mock;
  };

  const userId = 1;
  const storedTimestamp = new Date('2026-06-16T10:00:00.000Z');

  const validModelJson =
    '{"title":"Bitcoin and Ethereum Update","insight":"Bitcoin rose 2.2% during the last 24 hours. Ethereum also moved higher while recent headlines reflected ongoing network and market activity."}';

  function buildStoredInsight(contextHash: string) {
    return {
      userId,
      generatedForDate: getUtcDateString(storedTimestamp),
      title: 'Bitcoin and Ethereum Update',
      content:
        'Bitcoin rose 2.2% during the last 24 hours. Ethereum also moved higher while recent headlines reflected ongoing network and market activity.',
      contextHash,
      sourceDataSnapshot: {
        investorProfile: InvestorProfile.LONG_TERM_HOLDER,
        selectedCoins: [
          { id: 1, symbol: 'BTC', name: 'Bitcoin' },
          { id: 2, symbol: 'ETH', name: 'Ethereum' },
        ],
        marketFacts: [],
        newsFacts: [],
      },
      updatedAt: storedTimestamp,
    };
  }

  beforeEach(async () => {
    preferencesService = { getPreferences: jest.fn() };
    selectedCoinsService = { getSelectedCoins: jest.fn() };
    marketService = { getMarketData: jest.fn() };
    newsService = { getNews: jest.fn() };
    openRouterClient = { generateInsightContent: jest.fn() };
    dailyInsightRepository = {
      findOne: jest.fn().mockResolvedValue(null),
      findOneOrFail: jest.fn(),
      upsert: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InsightsService,
        { provide: PreferencesService, useValue: preferencesService },
        { provide: SelectedCoinsService, useValue: selectedCoinsService },
        { provide: MarketService, useValue: marketService },
        { provide: NewsService, useValue: newsService },
        { provide: OpenRouterClient, useValue: openRouterClient },
        {
          provide: getRepositoryToken(DailyInsight),
          useValue: dailyInsightRepository,
        },
      ],
    }).compile();

    insightsService = module.get(InsightsService);
  });

  function mockHappyPathDependencies(): void {
    preferencesService.getPreferences.mockResolvedValue({
      investorProfile: InvestorProfile.LONG_TERM_HOLDER,
    });
    selectedCoinsService.getSelectedCoins.mockResolvedValue({
      items: [
        { id: 1, coingeckoId: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
        { id: 2, coingeckoId: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
      ],
    });
    marketService.getMarketData.mockResolvedValue({
      items: [
        {
          id: 'bitcoin',
          symbol: 'BTC',
          name: 'Bitcoin',
          currentPrice: 65823,
          changePercentage24h: 2.17,
          high24h: 65893,
          low24h: 63663,
        },
      ],
    });
    newsService.getNews.mockResolvedValue({
      items: [
        {
          id: 'article-1',
          title: 'Bitcoin market update',
          description: 'Short description',
        },
      ],
      nextPage: null,
    });
    openRouterClient.generateInsightContent.mockResolvedValue(validModelJson);
    dailyInsightRepository.findOne.mockResolvedValue(null);
    dailyInsightRepository.findOneOrFail.mockResolvedValue(
      buildStoredInsight(
        buildInsightContextHash(InvestorProfile.LONG_TERM_HOLDER, [1, 2]),
      ),
    );
  }

  it('returns 400 without calling OpenRouter when no coins are selected', async () => {
    preferencesService.getPreferences.mockResolvedValue({
      investorProfile: InvestorProfile.BEGINNER,
    });
    selectedCoinsService.getSelectedCoins.mockResolvedValue({ items: [] });

    await expect(
      insightsService.getDailyInsight(userId),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(openRouterClient.generateInsightContent).not.toHaveBeenCalled();
  });

  it('returns 502 without calling OpenRouter when market data is empty', async () => {
    preferencesService.getPreferences.mockResolvedValue({
      investorProfile: InvestorProfile.BEGINNER,
    });
    selectedCoinsService.getSelectedCoins.mockResolvedValue({
      items: [
        { id: 1, coingeckoId: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
      ],
    });
    marketService.getMarketData.mockResolvedValue({ items: [] });

    await expect(
      insightsService.getDailyInsight(userId),
    ).rejects.toBeInstanceOf(BadGatewayException);
    expect(openRouterClient.generateInsightContent).not.toHaveBeenCalled();
  });

  it('orchestrates preferences, market data, and news before calling OpenRouter', async () => {
    mockHappyPathDependencies();

    await insightsService.getDailyInsight(userId);

    expect(preferencesService.getPreferences).toHaveBeenCalledWith(userId);
    expect(marketService.getMarketData).toHaveBeenCalledWith(userId);
    expect(newsService.getNews).toHaveBeenCalledWith(userId, { limit: 3 });
    expect(openRouterClient.generateInsightContent).toHaveBeenCalled();
  });

  it('adds disclaimer and generatedAt in the application response', async () => {
    mockHappyPathDependencies();

    const result = await insightsService.getDailyInsight(userId);

    expect(result.disclaimer).toBe(INSIGHT_DISCLAIMER);
    expect(result.generatedAt).toBe(storedTimestamp.toISOString());
    expect(result.title).toBe('Bitcoin and Ethereum Update');
    expect(result.insight).toContain('Bitcoin rose 2.2%');
    expect(dailyInsightRepository.upsert).toHaveBeenCalled();
  });

  it('generates new content when the UTC date changes', async () => {
    mockHappyPathDependencies();
    const dateSpy = jest
      .spyOn(dailyContentUtils, 'getUtcDateString')
      .mockReturnValueOnce('2026-06-16')
      .mockReturnValueOnce('2026-06-16')
      .mockReturnValueOnce('2026-06-16')
      .mockReturnValueOnce('2026-06-16')
      .mockReturnValue('2026-06-17');

    await insightsService.getDailyInsight(userId);
    openRouterClient.generateInsightContent.mockClear();
    dailyInsightRepository.findOne.mockResolvedValue(null);
    dailyInsightRepository.findOneOrFail.mockResolvedValue(
      buildStoredInsight(
        buildInsightContextHash(InvestorProfile.LONG_TERM_HOLDER, [1, 2]),
      ),
    );

    await insightsService.getDailyInsight(userId);

    expect(openRouterClient.generateInsightContent).toHaveBeenCalledTimes(1);
    dateSpy.mockRestore();
  });

  it('returns stored insight on a second same-day request without calling providers', async () => {
    preferencesService.getPreferences.mockResolvedValue({
      investorProfile: InvestorProfile.LONG_TERM_HOLDER,
    });
    selectedCoinsService.getSelectedCoins.mockResolvedValue({
      items: [
        { id: 1, coingeckoId: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
        { id: 2, coingeckoId: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
      ],
    });
    const contextHash = buildInsightContextHash(
      InvestorProfile.LONG_TERM_HOLDER,
      [1, 2],
    );
    dailyInsightRepository.findOne.mockResolvedValue(
      buildStoredInsight(contextHash),
    );

    const result = await insightsService.getDailyInsight(userId);

    expect(result.generatedAt).toBe(storedTimestamp.toISOString());
    expect(marketService.getMarketData).not.toHaveBeenCalled();
    expect(newsService.getNews).not.toHaveBeenCalled();
    expect(openRouterClient.generateInsightContent).not.toHaveBeenCalled();
    expect(dailyInsightRepository.upsert).not.toHaveBeenCalled();
  });

  it('regenerates when investor profile changes', async () => {
    mockHappyPathDependencies();
    preferencesService.getPreferences.mockResolvedValue({
      investorProfile: InvestorProfile.BEGINNER,
    });

    await insightsService.getDailyInsight(userId);

    expect(openRouterClient.generateInsightContent).toHaveBeenCalled();
    expect(dailyInsightRepository.upsert).toHaveBeenCalled();
  });

  it('regenerates when selected coins change', async () => {
    mockHappyPathDependencies();
    selectedCoinsService.getSelectedCoins.mockResolvedValue({
      items: [{ id: 3, coingeckoId: 'solana', symbol: 'SOL', name: 'Solana' }],
    });

    await insightsService.getDailyInsight(userId);

    expect(openRouterClient.generateInsightContent).toHaveBeenCalled();
    expect(dailyInsightRepository.upsert).toHaveBeenCalled();
  });

  it('stores a safe snapshot without secrets or raw provider data', async () => {
    mockHappyPathDependencies();

    await insightsService.getDailyInsight(userId);

    const serialized = JSON.stringify(dailyInsightRepository.upsert.mock.calls);

    expect(serialized).not.toContain('password');
    expect(serialized).not.toContain('api_key');
    expect(serialized).not.toContain('Bearer');
    expect(serialized).not.toContain('reasoning');
    expect(serialized).not.toContain('email');
  });

  it('does not expose snapshot or context hash in the public response', async () => {
    mockHappyPathDependencies();

    const result = await insightsService.getDailyInsight(userId);

    expect(result).not.toHaveProperty('sourceDataSnapshot');
    expect(result).not.toHaveProperty('contextHash');
  });

  it('returns the stored row after a concurrent upsert race', async () => {
    mockHappyPathDependencies();
    const contextHash = buildInsightContextHash(
      InvestorProfile.LONG_TERM_HOLDER,
      [1, 2],
    );
    dailyInsightRepository.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(buildStoredInsight(contextHash));

    const result = await insightsService.getDailyInsight(userId);

    expect(result.generatedAt).toBe(storedTimestamp.toISOString());
    expect(dailyInsightRepository.upsert).toHaveBeenCalled();
  });

  it('does not return provider reasoning or usage fields', async () => {
    mockHappyPathDependencies();

    const result = await insightsService.getDailyInsight(userId);

    expect(result).not.toHaveProperty('reasoning');
    expect(result).not.toHaveProperty('usage');
    expect(result).not.toHaveProperty('provider');
    expect(result).not.toHaveProperty('prompt');
  });

  it('maps timeout errors from OpenRouter to 504', async () => {
    mockHappyPathDependencies();
    openRouterClient.generateInsightContent.mockRejectedValue(
      new GatewayTimeoutException('AI insight request timed out'),
    );

    await expect(
      insightsService.getDailyInsight(userId),
    ).rejects.toBeInstanceOf(GatewayTimeoutException);
  });

  it('maps rate limit errors from OpenRouter to 503', async () => {
    mockHappyPathDependencies();
    openRouterClient.generateInsightContent.mockRejectedValue(
      new ServiceUnavailableException(
        'AI insight service is temporarily unavailable',
      ),
    );

    await expect(
      insightsService.getDailyInsight(userId),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('maps upstream failures from OpenRouter to 502', async () => {
    mockHappyPathDependencies();
    openRouterClient.generateInsightContent.mockRejectedValue(
      new BadGatewayException('Unable to generate insight'),
    );

    await expect(
      insightsService.getDailyInsight(userId),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });

  it('generateFromData does not call MarketService or NewsService', async () => {
    openRouterClient.generateInsightContent.mockResolvedValue(validModelJson);

    await insightsService.generateFromData({
      investorProfile: InvestorProfile.LONG_TERM_HOLDER,
      selectedCoins: [{ id: 1, symbol: 'BTC', name: 'Bitcoin' }],
      marketItems: [
        {
          symbol: 'BTC',
          name: 'Bitcoin',
          currentPrice: 65823,
          changePercentage24h: 2.17,
          high24h: 65893,
          low24h: 63663,
        },
      ],
      newsItems: [
        {
          id: 'article-1',
          title: 'Bitcoin market update',
          description: 'Short description',
        },
      ],
    });

    expect(marketService.getMarketData).not.toHaveBeenCalled();
    expect(newsService.getNews).not.toHaveBeenCalled();
    expect(openRouterClient.generateInsightContent).toHaveBeenCalled();
  });
});

describe('insight prompt builder', () => {
  it('includes only supplied facts in the prompt', () => {
    const prompt = buildInsightUserPrompt({
      investorProfile: InvestorProfile.LONG_TERM_HOLDER,
      selectedCoins: [{ symbol: 'BTC', name: 'Bitcoin' }],
      marketFacts: [
        {
          symbol: 'BTC',
          name: 'Bitcoin',
          currentPrice: 65823,
          changePercentage24h: 2.17,
          high24h: 65893,
          low24h: 63663,
        },
      ],
      newsFacts: [
        {
          title: 'Bitcoin market update',
          description: 'Short description',
        },
      ],
    });

    expect(prompt).toContain('Investor profile: LONG_TERM_HOLDER');
    expect(prompt).toContain('Bitcoin (BTC)');
    expect(prompt).toContain('price 65823');
    expect(prompt).toContain('Bitcoin market update');
    expect(prompt).not.toContain('password');
    expect(prompt).not.toContain('Bearer');
    expect(prompt).not.toContain('@example.com');
  });

  it('does not include secrets, email, or tokens in messages', () => {
    const messages = buildInsightMessages({
      investorProfile: InvestorProfile.BEGINNER,
      selectedCoins: [{ symbol: 'BTC', name: 'Bitcoin' }],
      marketFacts: [
        {
          symbol: 'BTC',
          name: 'Bitcoin',
          currentPrice: 100,
          changePercentage24h: 1,
          high24h: 110,
          low24h: 90,
        },
      ],
      newsFacts: [],
    });

    const serialized = JSON.stringify(messages);

    expect(serialized).not.toContain('api_key');
    expect(serialized).not.toContain('JWT');
    expect(serialized).not.toContain('Bearer');
    expect(serialized).not.toContain('@');
  });
});

describe('insight output validation', () => {
  const validOutput = {
    title: 'Bitcoin and Ethereum Update',
    insight:
      'Bitcoin rose 2.2% during the last 24 hours. Ethereum also moved higher while recent headlines reflected ongoing network and market activity.',
  };

  it('accepts a valid structured response', () => {
    expect(validateModelInsightOutput(validOutput)).toEqual(validOutput);
  });

  it('rejects invalid JSON content', () => {
    expect(() => parseModelInsightContent('not-json')).toThrow(
      BadGatewayException,
    );
  });

  it('rejects additional JSON fields', () => {
    expect(() =>
      validateModelInsightOutput({
        ...validOutput,
        disclaimer: 'extra',
      }),
    ).toThrow(BadGatewayException);
  });

  it('rejects missing title or insight', () => {
    expect(() =>
      validateModelInsightOutput({
        title: '',
        insight: validOutput.insight,
      }),
    ).toThrow(BadGatewayException);

    expect(() =>
      validateModelInsightOutput({
        title: validOutput.title,
        insight: '',
      }),
    ).toThrow(BadGatewayException);
  });

  it('rejects insights with fewer or more than two sentences', () => {
    expect(() =>
      validateModelInsightOutput({
        title: validOutput.title,
        insight: 'Only one sentence.',
      }),
    ).toThrow(BadGatewayException);

    expect(() =>
      validateModelInsightOutput({
        title: validOutput.title,
        insight: 'First sentence. Second sentence. Third sentence.',
      }),
    ).toThrow(BadGatewayException);
  });

  it('rejects recommendation language', () => {
    expect(() =>
      validateModelInsightOutput({
        title: 'Market note',
        insight:
          'This may be a good time to invest in Bitcoin. Prices moved higher during the last day.',
      }),
    ).toThrow(BadGatewayException);
  });

  it('counts sentences correctly', () => {
    expect(
      countSentences(
        'Bitcoin rose 2.2% during the last 24 hours. Ethereum also moved higher while recent headlines reflected ongoing network and market activity.',
      ),
    ).toBe(2);
  });
});
