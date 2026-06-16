import {
  BadGatewayException,
  BadRequestException,
  GatewayTimeoutException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MarketService } from '../market/market.service';
import { PreferencesService } from '../preferences/preferences.service';
import { InvestorProfile } from '../preferences/enums/investor-profile.enum';
import { SelectedCoinsService } from '../selected-coins/selected-coins.service';
import {
  buildMemeContextHash,
  getUtcDateString,
} from '../common/utils/daily-content.utils';
import * as dailyContentUtils from '../common/utils/daily-content.utils';
import { DEFAULT_IMGFLIP_TEMPLATE_IDS } from '../config/imgflip-template-ids.constants';
import { buildTemplatePoolVersion } from '../config/imgflip-template-ids.utils';
import { DailyMeme } from './entities/daily-meme.entity';
import { ImgflipClient } from './imgflip.client';
import { MemesService } from './memes.service';
import {
  buildMemeCaptions,
  getEligibleCaptionVariationIds,
  getMovementCategory,
  selectMostVolatileMarketItem,
} from './utils/meme-caption.builder';
import {
  getTemplateAttemptOrder,
  selectMemeVariation,
} from './utils/meme-variation.utils';
import { buildCaptionsForSnapshot } from './utils/meme-snapshot.builder';

describe('MemesService', () => {
  let memesService: MemesService;
  let selectedCoinsService: { getSelectedCoins: jest.Mock };
  let preferencesService: { getPreferences: jest.Mock };
  let marketService: { getMarketData: jest.Mock };
  let imgflipClient: { captionImage: jest.Mock };
  let configService: { getOrThrow: jest.Mock };
  let dailyMemeRepository: {
    findOne: jest.Mock;
    findOneOrFail: jest.Mock;
    upsert: jest.Mock;
  };

  const userId = 1;
  const templateIds = [...DEFAULT_IMGFLIP_TEMPLATE_IDS];
  const templatePoolVersion = buildTemplatePoolVersion(templateIds);
  const storedTimestamp = new Date('2026-06-16T10:00:00.000Z');
  const generatedForDate = getUtcDateString(storedTimestamp);
  const investorProfile = InvestorProfile.LONG_TERM_HOLDER;

  const generationInput = {
    userId,
    investorProfile,
    generatedForDate,
    selectedCoins: [
      { id: 1, coingeckoId: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
      { id: 2, coingeckoId: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
    ],
    marketItems: [
      {
        id: 'bitcoin',
        symbol: 'BTC',
        name: 'Bitcoin',
        changePercentage24h: 2.2,
      },
      {
        id: 'ethereum',
        symbol: 'ETH',
        name: 'Ethereum',
        changePercentage24h: -5.1,
      },
    ],
  };

  const selectedMarketItem = selectMostVolatileMarketItem(
    generationInput.marketItems.map((item) => ({
      symbol: item.symbol,
      name: item.name,
      changePercentage24h: item.changePercentage24h,
    })),
  );
  const movement = getMovementCategory(selectedMarketItem.changePercentage24h);
  const eligibleCaptionVariationIds = getEligibleCaptionVariationIds(
    movement,
    investorProfile,
  );
  const variation = selectMemeVariation({
    userId,
    generatedForDate,
    investorProfile,
    selectedCoinIds: [1, 2],
    templateIds,
    eligibleCaptionVariationIds,
    previousDayMeme: null,
  });
  const expectedCaptions = buildCaptionsForSnapshot(
    generationInput,
    variation.captionVariationId,
  );

  function buildContextHash(selectedCoinIds: number[]) {
    return buildMemeContextHash({
      userId,
      investorProfile,
      selectedCoinIds,
      templatePoolVersion,
    });
  }

  function buildStoredMeme(contextHash: string) {
    return {
      userId,
      templateId: variation.templateId,
      imageUrl: 'https://i.imgflip.com/example.jpg',
      pageUrl: 'https://imgflip.com/i/example',
      textTop: expectedCaptions.textTop,
      textBottom: expectedCaptions.textBottom,
      generatedForDate,
      contextHash,
      sourceDataSnapshot: {
        templateId: variation.templateId,
        captionVariationId: variation.captionVariationId,
        investorProfile,
        selectedCoins: generationInput.selectedCoins.map((coin) => ({
          id: coin.id,
          symbol: coin.symbol,
          name: coin.name,
        })),
        selectedMarketItem: {
          symbol: 'ETH',
          name: 'Ethereum',
          changePercentage24h: -5.1,
        },
      },
      updatedAt: storedTimestamp,
    };
  }

  beforeEach(async () => {
    jest
      .spyOn(dailyContentUtils, 'getUtcDateString')
      .mockReturnValue(generatedForDate);

    selectedCoinsService = { getSelectedCoins: jest.fn() };
    preferencesService = {
      getPreferences: jest.fn().mockResolvedValue({
        investorProfile,
        showMarketPrices: true,
        showNews: true,
        showAiInsight: true,
        showMeme: true,
      }),
    };
    marketService = { getMarketData: jest.fn() };
    imgflipClient = { captionImage: jest.fn() };
    configService = {
      getOrThrow: jest.fn((key: string) => {
        if (key === 'IMGFLIP_TEMPLATE_IDS') {
          return templateIds.join(',');
        }

        throw new Error(`Unexpected config key: ${key}`);
      }),
    };
    dailyMemeRepository = {
      findOne: jest.fn().mockResolvedValue(null),
      findOneOrFail: jest.fn(),
      upsert: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MemesService,
        { provide: SelectedCoinsService, useValue: selectedCoinsService },
        { provide: PreferencesService, useValue: preferencesService },
        { provide: MarketService, useValue: marketService },
        { provide: ImgflipClient, useValue: imgflipClient },
        { provide: ConfigService, useValue: configService },
        {
          provide: getRepositoryToken(DailyMeme),
          useValue: dailyMemeRepository,
        },
      ],
    }).compile();

    memesService = module.get(MemesService);
  });

  function mockHappyPathDependencies(): void {
    selectedCoinsService.getSelectedCoins.mockResolvedValue({
      items: generationInput.selectedCoins,
    });
    marketService.getMarketData.mockResolvedValue({
      items: generationInput.marketItems,
    });
    imgflipClient.captionImage.mockResolvedValue({
      url: 'https://i.imgflip.com/example.jpg',
      pageUrl: 'https://imgflip.com/i/example',
    });
    dailyMemeRepository.findOne.mockResolvedValue(null);
    dailyMemeRepository.findOneOrFail.mockResolvedValue(
      buildStoredMeme(buildContextHash([1, 2])),
    );
  }

  it('returns 400 without calling Imgflip when no coins are selected', async () => {
    selectedCoinsService.getSelectedCoins.mockResolvedValue({ items: [] });

    await expect(memesService.getDailyMeme(userId)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(imgflipClient.captionImage).not.toHaveBeenCalled();
  });

  it('returns 502 without calling Imgflip when market data is empty', async () => {
    selectedCoinsService.getSelectedCoins.mockResolvedValue({
      items: generationInput.selectedCoins,
    });
    marketService.getMarketData.mockResolvedValue({ items: [] });

    await expect(memesService.getDailyMeme(userId)).rejects.toBeInstanceOf(
      BadGatewayException,
    );
    expect(imgflipClient.captionImage).not.toHaveBeenCalled();
  });

  it('maps a valid Imgflip response and adds generatedAt', async () => {
    mockHappyPathDependencies();

    const result = await memesService.getDailyMeme(userId);

    expect(imgflipClient.captionImage).toHaveBeenCalledWith({
      templateId: variation.templateId,
      text0: expectedCaptions.textTop,
      text1: expectedCaptions.textBottom,
    });
    expect(result.imageUrl).toBe('https://i.imgflip.com/example.jpg');
    expect(result.pageUrl).toBe('https://imgflip.com/i/example');
    expect(result.textTop).toBe(expectedCaptions.textTop);
    expect(result.textBottom).toBe(expectedCaptions.textBottom);
    expect(result.generatedAt).toBe(storedTimestamp.toISOString());
    expect(dailyMemeRepository.upsert).toHaveBeenCalled();
  });

  it('returns stored meme on a second same-day request without calling providers', async () => {
    selectedCoinsService.getSelectedCoins.mockResolvedValue({
      items: generationInput.selectedCoins,
    });
    const contextHash = buildContextHash([1, 2]);
    dailyMemeRepository.findOne.mockResolvedValue(buildStoredMeme(contextHash));

    const result = await memesService.getDailyMeme(userId);

    expect(result.generatedAt).toBe(storedTimestamp.toISOString());
    expect(marketService.getMarketData).not.toHaveBeenCalled();
    expect(imgflipClient.captionImage).not.toHaveBeenCalled();
    expect(dailyMemeRepository.upsert).not.toHaveBeenCalled();
  });

  it('regenerates when selected coins change', async () => {
    mockHappyPathDependencies();
    selectedCoinsService.getSelectedCoins.mockResolvedValue({
      items: [{ id: 3, coingeckoId: 'solana', symbol: 'SOL', name: 'Solana' }],
    });

    await memesService.getDailyMeme(userId);

    expect(imgflipClient.captionImage).toHaveBeenCalled();
    expect(dailyMemeRepository.upsert).toHaveBeenCalled();
  });

  it('regenerates when investor profile changes', async () => {
    mockHappyPathDependencies();
    preferencesService.getPreferences.mockResolvedValue({
      investorProfile: InvestorProfile.BEGINNER,
      showMarketPrices: true,
      showNews: true,
      showAiInsight: true,
      showMeme: true,
    });

    await memesService.getDailyMeme(userId);

    expect(imgflipClient.captionImage).toHaveBeenCalled();
    expect(dailyMemeRepository.upsert).toHaveBeenCalled();
  });

  it('regenerates when the template pool changes', async () => {
    mockHappyPathDependencies();
    configService.getOrThrow.mockImplementation((key: string) => {
      if (key === 'IMGFLIP_TEMPLATE_IDS') {
        return '999999,888888';
      }

      throw new Error(`Unexpected config key: ${key}`);
    });

    await memesService.getDailyMeme(userId);

    expect(imgflipClient.captionImage).toHaveBeenCalled();
    expect(dailyMemeRepository.upsert).toHaveBeenCalled();
  });

  it('stores a safe snapshot without credentials or raw Imgflip data', async () => {
    mockHappyPathDependencies();

    await memesService.getDailyMeme(userId);

    expect(dailyMemeRepository.upsert).toHaveBeenCalled();
    const [[upsertPayload]] = dailyMemeRepository.upsert.mock.calls as Array<
      [
        {
          sourceDataSnapshot: {
            templateId: number;
            captionVariationId: string;
            investorProfile: string;
            selectedMarketItem: {
              symbol: string;
              changePercentage24h: number;
            };
          };
        },
      ]
    >;
    const snapshot = upsertPayload.sourceDataSnapshot;
    const serialized = JSON.stringify(snapshot);

    expect(snapshot).toMatchObject({
      templateId: variation.templateId,
      captionVariationId: variation.captionVariationId,
      investorProfile,
      selectedMarketItem: {
        symbol: 'ETH',
        changePercentage24h: -5.1,
      },
    });
    expect(serialized).not.toContain('password');
    expect(serialized).not.toContain('username');
    expect(serialized).not.toContain('success');
    expect(serialized).not.toContain('error_message');
  });

  it('does not expose snapshot, context hash, or template pool in the public response', async () => {
    mockHappyPathDependencies();

    const result = await memesService.getDailyMeme(userId);

    expect(result).not.toHaveProperty('sourceDataSnapshot');
    expect(result).not.toHaveProperty('contextHash');
    expect(result).not.toHaveProperty('templateId');
    expect(result).not.toHaveProperty('captionVariationId');
    expect(result).not.toHaveProperty('seed');
  });

  it('does not expose credentials or raw Imgflip fields', async () => {
    mockHappyPathDependencies();

    const result = await memesService.getDailyMeme(userId);

    expect(result).not.toHaveProperty('username');
    expect(result).not.toHaveProperty('password');
    expect(result).not.toHaveProperty('success');
    expect(result).not.toHaveProperty('error_message');
    expect(JSON.stringify(result)).not.toContain('test-imgflip-password');
  });

  it('maps timeout errors from Imgflip to 504', async () => {
    mockHappyPathDependencies();
    imgflipClient.captionImage.mockRejectedValue(
      new GatewayTimeoutException('Meme generation request timed out'),
    );

    await expect(memesService.getDailyMeme(userId)).rejects.toBeInstanceOf(
      GatewayTimeoutException,
    );
  });

  it('maps rate limit errors from Imgflip to 503', async () => {
    mockHappyPathDependencies();
    imgflipClient.captionImage.mockRejectedValue(
      new ServiceUnavailableException(
        'Meme service is temporarily unavailable',
      ),
    );

    await expect(memesService.getDailyMeme(userId)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('maps upstream failures from Imgflip to 502', async () => {
    mockHappyPathDependencies();
    imgflipClient.captionImage.mockRejectedValue(
      new BadGatewayException('Unable to generate meme'),
    );

    await expect(memesService.getDailyMeme(userId)).rejects.toBeInstanceOf(
      BadGatewayException,
    );
  });

  it('retries once with the next deterministic template when the first Imgflip call fails', async () => {
    imgflipClient.captionImage
      .mockRejectedValueOnce(new BadGatewayException('Unable to generate meme'))
      .mockResolvedValueOnce({
        url: 'https://i.imgflip.com/fallback.jpg',
        pageUrl: 'https://imgflip.com/i/fallback',
      });

    const result = await memesService.generateFromMarketData({
      ...generationInput,
      previousDayMeme: null,
    });

    const attemptOrder = getTemplateAttemptOrder(
      templateIds,
      variation.templateIndex,
    );

    expect(imgflipClient.captionImage).toHaveBeenCalledTimes(2);
    expect(imgflipClient.captionImage).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ templateId: attemptOrder[0] }),
    );
    expect(imgflipClient.captionImage).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ templateId: attemptOrder[1] }),
    );
    expect(result.imageUrl).toBe('https://i.imgflip.com/fallback.jpg');
  });

  it('generateFromMarketData does not call MarketService', async () => {
    imgflipClient.captionImage.mockResolvedValue({
      url: 'https://i.imgflip.com/example.jpg',
      pageUrl: 'https://imgflip.com/i/example',
    });

    await memesService.generateFromMarketData({
      userId,
      investorProfile,
      generatedForDate,
      selectedCoins: [{ id: 1, symbol: 'BTC', name: 'Bitcoin' }],
      marketItems: [
        {
          symbol: 'BTC',
          name: 'Bitcoin',
          changePercentage24h: 2.2,
        },
      ],
    });

    expect(marketService.getMarketData).not.toHaveBeenCalled();
    expect(imgflipClient.captionImage).toHaveBeenCalled();
  });
});

describe('meme caption builder', () => {
  it('selects the coin with the largest absolute 24-hour change', () => {
    const selected = selectMostVolatileMarketItem([
      { symbol: 'BTC', name: 'Bitcoin', changePercentage24h: 2.2 },
      { symbol: 'ETH', name: 'Ethereum', changePercentage24h: -5.1 },
    ]);

    expect(selected.symbol).toBe('ETH');
  });

  it('builds captions from supplied market facts only', () => {
    const captions = buildMemeCaptions(
      [{ symbol: 'btc', name: 'Bitcoin', changePercentage24h: 2.17 }],
      InvestorProfile.BEGINNER,
      'positive-general-moved-24h',
    );

    expect(captions.textTop).toBe('BTC moved +2.2% in 24 hours');
    expect(captions.textBottom).toBe('Me checking the dashboard again');
  });

  it('uses a neutral fallback when percentage values are unavailable', () => {
    const captions = buildMemeCaptions(
      [
        { symbol: 'btc', name: 'Bitcoin', changePercentage24h: null },
        { symbol: 'eth', name: 'Ethereum', changePercentage24h: null },
      ],
      InvestorProfile.BEGINNER,
      'neutral-beginner-learning',
    );

    expect(captions.textTop).toBe('BTC is on my watchlist');
    expect(captions.textBottom).toBe(
      'Learning one dashboard refresh at a time',
    );
  });

  it('does not include recommendation language', () => {
    const captions = buildMemeCaptions(
      [{ symbol: 'BTC', name: 'Bitcoin', changePercentage24h: 1.5 }],
      InvestorProfile.BEGINNER,
      'positive-general-moved-24h',
    );

    expect(captions.textTop).not.toMatch(/\bbuy\b/i);
    expect(captions.textTop).not.toMatch(/\bsell\b/i);
    expect(captions.textTop).not.toMatch(/\bhold\b/i);
    expect(captions.textBottom).not.toMatch(/investment opportunity/i);
  });
});
