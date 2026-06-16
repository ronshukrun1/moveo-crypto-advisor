import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Coin } from '../coins/entities/coin.entity';
import { DailyInsight } from '../insights/entities/daily-insight.entity';
import { DailyMeme } from '../memes/entities/daily-meme.entity';
import { UserSelectedCoin } from '../selected-coins/entities/user-selected-coin.entity';
import { FeedbackContentType } from './enums/feedback-content-type.enum';
import { FeedbackType } from './enums/feedback-type.enum';
import { Feedback } from './entities/feedback.entity';
import { FeedbackService } from './feedback.service';

describe('FeedbackService', () => {
  let feedbackService: FeedbackService;
  let feedbackRepository: {
    upsert: jest.Mock;
    findOneOrFail: jest.Mock;
    find: jest.Mock;
  };
  let coinRepository: { findOne: jest.Mock };
  let userSelectedCoinRepository: { findOne: jest.Mock };
  let dailyInsightRepository: { findOne: jest.Mock };
  let dailyMemeRepository: { findOne: jest.Mock };

  const userId = 1;
  const savedFeedback: Feedback = {
    id: 10,
    userId,
    user: undefined as unknown as Feedback['user'],
    contentType: FeedbackContentType.INSIGHT,
    contentId: 'daily-insight:5',
    feedbackType: FeedbackType.UP,
    createdAt: new Date('2026-06-16T10:00:00.000Z'),
    updatedAt: new Date('2026-06-16T10:00:00.000Z'),
  };

  beforeEach(async () => {
    feedbackRepository = {
      upsert: jest.fn().mockResolvedValue(undefined),
      findOneOrFail: jest.fn().mockResolvedValue(savedFeedback),
      find: jest.fn().mockResolvedValue([savedFeedback]),
    };
    coinRepository = { findOne: jest.fn() };
    userSelectedCoinRepository = { findOne: jest.fn() };
    dailyInsightRepository = { findOne: jest.fn() };
    dailyMemeRepository = { findOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedbackService,
        { provide: getRepositoryToken(Feedback), useValue: feedbackRepository },
        { provide: getRepositoryToken(Coin), useValue: coinRepository },
        {
          provide: getRepositoryToken(UserSelectedCoin),
          useValue: userSelectedCoinRepository,
        },
        {
          provide: getRepositoryToken(DailyInsight),
          useValue: dailyInsightRepository,
        },
        {
          provide: getRepositoryToken(DailyMeme),
          useValue: dailyMemeRepository,
        },
      ],
    }).compile();

    feedbackService = module.get(FeedbackService);
  });

  it('creates the first vote', async () => {
    dailyInsightRepository.findOne.mockResolvedValue({ id: 5, userId });

    const result = await feedbackService.upsertFeedback(userId, {
      contentType: FeedbackContentType.INSIGHT,
      contentId: 'daily-insight:5',
      feedbackType: FeedbackType.UP,
    });

    expect(feedbackRepository.upsert).toHaveBeenCalledWith(
      {
        userId,
        contentType: FeedbackContentType.INSIGHT,
        contentId: 'daily-insight:5',
        feedbackType: FeedbackType.UP,
      },
      { conflictPaths: ['userId', 'contentType', 'contentId'] },
    );
    expect(result).toEqual({
      contentType: FeedbackContentType.INSIGHT,
      contentId: 'daily-insight:5',
      feedbackType: FeedbackType.UP,
      updatedAt: savedFeedback.updatedAt.toISOString(),
    });
    expect(result).not.toHaveProperty('id');
    expect(result).not.toHaveProperty('userId');
  });

  it('treats repeating the same vote as idempotent upsert', async () => {
    dailyInsightRepository.findOne.mockResolvedValue({ id: 5, userId });

    await feedbackService.upsertFeedback(userId, {
      contentType: FeedbackContentType.INSIGHT,
      contentId: 'daily-insight:5',
      feedbackType: FeedbackType.UP,
    });
    await feedbackService.upsertFeedback(userId, {
      contentType: FeedbackContentType.INSIGHT,
      contentId: 'daily-insight:5',
      feedbackType: FeedbackType.UP,
    });

    expect(feedbackRepository.upsert).toHaveBeenCalledTimes(2);
  });

  it('updates an existing vote from UP to DOWN', async () => {
    dailyInsightRepository.findOne.mockResolvedValue({ id: 5, userId });
    feedbackRepository.findOneOrFail.mockResolvedValue({
      ...savedFeedback,
      feedbackType: FeedbackType.DOWN,
    });

    const result = await feedbackService.upsertFeedback(userId, {
      contentType: FeedbackContentType.INSIGHT,
      contentId: 'daily-insight:5',
      feedbackType: FeedbackType.DOWN,
    });

    expect(result.feedbackType).toBe(FeedbackType.DOWN);
  });

  it('validates market content against selected active coins', async () => {
    coinRepository.findOne.mockResolvedValue({ id: 1, isActive: true });
    userSelectedCoinRepository.findOne.mockResolvedValue({ userId, coinId: 1 });
    feedbackRepository.findOneOrFail.mockResolvedValue({
      ...savedFeedback,
      contentType: FeedbackContentType.MARKET,
      contentId: 'coin:1',
    });

    await feedbackService.upsertFeedback(userId, {
      contentType: FeedbackContentType.MARKET,
      contentId: 'coin:1',
      feedbackType: FeedbackType.UP,
    });

    expect(coinRepository.findOne).toHaveBeenCalledWith({
      where: { id: 1, isActive: true },
    });
  });

  it('rejects invalid market content targets', async () => {
    await expect(
      feedbackService.upsertFeedback(userId, {
        contentType: FeedbackContentType.MARKET,
        contentId: 'invalid-market-id',
        feedbackType: FeedbackType.UP,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects missing or invalid content targets', async () => {
    dailyInsightRepository.findOne.mockResolvedValue(null);

    await expect(
      feedbackService.upsertFeedback(userId, {
        contentType: FeedbackContentType.INSIGHT,
        contentId: 'daily-insight:999',
        feedbackType: FeedbackType.UP,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns existing votes for requested content IDs', async () => {
    const result = await feedbackService.getFeedback(userId, [
      'daily-insight:5',
      'coin:1',
    ]);

    expect(feedbackRepository.find).toHaveBeenCalled();
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).not.toHaveProperty('userId');
  });
});
