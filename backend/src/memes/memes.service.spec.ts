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
import { SelectedCoinsService } from '../selected-coins/selected-coins.service';
import {
  buildMemeContextHash,
  getUtcDateString,
} from '../common/utils/daily-content.utils';
import { DailyMeme } from './entities/daily-meme.entity';
import { ImgflipClient } from './imgflip.client';
import { MemesService } from './memes.service';
import {
  buildMemeCaptions,
  selectMostVolatileMarketItem,
} from './utils/meme-caption.builder';

describe('MemesService', () => {
  let memesService: MemesService;
  let selectedCoinsService: { getSelectedCoins: jest.Mock };
  let marketService: { getMarketData: jest.Mock };
  let imgflipClient: { captionImage: jest.Mock };
  let configService: { getOrThrow: jest.Mock };
  let dailyMemeRepository: {
    findOne: jest.Mock;
    findOneOrFail: jest.Mock;
    upsert: jest.Mock;
  };

  const userId = 1;
  const templateId = 181913649;
  const storedTimestamp = new Date('2026-06-16T10:00:00.000Z');

  function buildStoredMeme(contextHash: string) {
    return {
      userId,
      templateId,
      imageUrl: 'https://i.imgflip.com/example.jpg',
      pageUrl: 'https://imgflip.com/i/example',
      textTop: 'ETH moved -5.1% in 24 hours',
      textBottom: 'Me checking the dashboard again',
      generatedForDate: getUtcDateString(storedTimestamp),
      contextHash,
      sourceDataSnapshot: {
        templateId,
        selectedCoins: [
          { id: 1, symbol: 'BTC', name: 'Bitcoin' },
          { id: 2, symbol: 'ETH', name: 'Ethereum' },
        ],
        marketFacts: [],
      },
      updatedAt: storedTimestamp,
    };
  }

  beforeEach(async () => {
    selectedCoinsService = { getSelectedCoins: jest.fn() };
    marketService = { getMarketData: jest.fn() };
    imgflipClient = { captionImage: jest.fn() };
    configService = {
      getOrThrow: jest.fn((key: string) => {
        if (key === 'IMGFLIP_TEMPLATE_ID') {
          return templateId;
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
          changePercentage24h: 2.2,
        },
        {
          id: 'ethereum',
          symbol: 'ETH',
          name: 'Ethereum',
          changePercentage24h: -5.1,
        },
      ],
    });
    imgflipClient.captionImage.mockResolvedValue({
      url: 'https://i.imgflip.com/example.jpg',
      pageUrl: 'https://imgflip.com/i/example',
    });
    dailyMemeRepository.findOne.mockResolvedValue(null);
    dailyMemeRepository.findOneOrFail.mockResolvedValue(
      buildStoredMeme(buildMemeContextHash([1, 2], templateId)),
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
      items: [
        { id: 1, coingeckoId: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
      ],
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
      text0: 'ETH moved -5.1% in 24 hours',
      text1: 'Me checking the dashboard again',
    });
    expect(result.imageUrl).toBe('https://i.imgflip.com/example.jpg');
    expect(result.pageUrl).toBe('https://imgflip.com/i/example');
    expect(result.textTop).toBe('ETH moved -5.1% in 24 hours');
    expect(result.textBottom).toBe('Me checking the dashboard again');
    expect(result.generatedAt).toBe(storedTimestamp.toISOString());
    expect(dailyMemeRepository.upsert).toHaveBeenCalled();
  });

  it('returns stored meme on a second same-day request without calling providers', async () => {
    selectedCoinsService.getSelectedCoins.mockResolvedValue({
      items: [
        { id: 1, coingeckoId: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
        { id: 2, coingeckoId: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
      ],
    });
    const contextHash = buildMemeContextHash([1, 2], templateId);
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

  it('regenerates when template ID changes', async () => {
    mockHappyPathDependencies();
    configService.getOrThrow.mockImplementation((key: string) => {
      if (key === 'IMGFLIP_TEMPLATE_ID') {
        return 999999;
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

    const serialized = JSON.stringify(dailyMemeRepository.upsert.mock.calls);

    expect(serialized).not.toContain('password');
    expect(serialized).not.toContain('username');
    expect(serialized).not.toContain('success');
    expect(serialized).not.toContain('error_message');
  });

  it('does not expose snapshot or context hash in the public response', async () => {
    mockHappyPathDependencies();

    const result = await memesService.getDailyMeme(userId);

    expect(result).not.toHaveProperty('sourceDataSnapshot');
    expect(result).not.toHaveProperty('contextHash');
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

  it('generateFromMarketData does not call MarketService', async () => {
    imgflipClient.captionImage.mockResolvedValue({
      url: 'https://i.imgflip.com/example.jpg',
      pageUrl: 'https://imgflip.com/i/example',
    });

    await memesService.generateFromMarketData({
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
    const captions = buildMemeCaptions([
      { symbol: 'btc', name: 'Bitcoin', changePercentage24h: 2.17 },
    ]);

    expect(captions).toEqual({
      textTop: 'BTC moved 2.2% in 24 hours',
      textBottom: 'Me checking the dashboard again',
    });
  });

  it('uses a neutral fallback when percentage values are unavailable', () => {
    const captions = buildMemeCaptions([
      { symbol: 'btc', name: 'Bitcoin', changePercentage24h: null },
      { symbol: 'eth', name: 'Ethereum', changePercentage24h: null },
    ]);

    expect(captions.textTop).toBe('BTC is on my watchlist');
    expect(captions.textBottom).toBe('Me checking the dashboard again');
  });

  it('does not include recommendation language', () => {
    const captions = buildMemeCaptions([
      { symbol: 'BTC', name: 'Bitcoin', changePercentage24h: 1.5 },
    ]);

    expect(captions.textTop).not.toMatch(/\bbuy\b/i);
    expect(captions.textTop).not.toMatch(/\bsell\b/i);
    expect(captions.textTop).not.toMatch(/\bhold\b/i);
    expect(captions.textBottom).not.toMatch(/investment opportunity/i);
  });
});
