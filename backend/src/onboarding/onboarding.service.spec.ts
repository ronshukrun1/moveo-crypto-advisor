import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { Coin } from '../coins/entities/coin.entity';
import { PreferencesService } from '../preferences/preferences.service';
import { InvestorProfile } from '../preferences/enums/investor-profile.enum';
import { UserPreference } from '../preferences/entities/user-preference.entity';
import { SelectedCoinsService } from '../selected-coins/selected-coins.service';
import { UsersService } from '../users/users.service';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';
import { OnboardingService } from './onboarding.service';

describe('OnboardingService', () => {
  let onboardingService: OnboardingService;
  let dataSource: { transaction: jest.Mock };
  let usersService: {
    findByIdWithManager: jest.Mock;
    setOnboardingCompletedWithManager: jest.Mock;
  };
  let preferencesService: { upsertForUserWithManager: jest.Mock };
  let selectedCoinsService: {
    validateActiveCoinIds: jest.Mock;
    replaceWithManager: jest.Mock;
  };

  const userId = 1;
  const manager = { id: 'manager' };
  const completeDto: CompleteOnboardingDto = {
    investorProfile: InvestorProfile.LONG_TERM_HOLDER,
    showMarketPrices: true,
    showNews: true,
    showAiInsight: false,
    showMeme: true,
    coinIds: [1, 2],
  };
  const bitcoin: Coin = {
    id: 1,
    coingeckoId: 'bitcoin',
    symbol: 'BTC',
    name: 'Bitcoin',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const ethereum: Coin = {
    id: 2,
    coingeckoId: 'ethereum',
    symbol: 'ETH',
    name: 'Ethereum',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const savedPreferences: UserPreference = {
    id: 10,
    userId,
    user: undefined as unknown as UserPreference['user'],
    investorProfile: InvestorProfile.LONG_TERM_HOLDER,
    showMarketPrices: true,
    showNews: true,
    showAiInsight: false,
    showMeme: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    usersService = {
      findByIdWithManager: jest.fn().mockResolvedValue({ id: userId }),
      setOnboardingCompletedWithManager: jest
        .fn()
        .mockResolvedValue({ id: userId, onboardingCompleted: true }),
    };
    preferencesService = {
      upsertForUserWithManager: jest.fn().mockResolvedValue(savedPreferences),
    };
    selectedCoinsService = {
      validateActiveCoinIds: jest.fn().mockResolvedValue([bitcoin, ethereum]),
      replaceWithManager: jest.fn().mockResolvedValue(undefined),
    };
    dataSource = {
      transaction: jest.fn(
        (callback: (transactionManager: typeof manager) => unknown) =>
          Promise.resolve(callback(manager)),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnboardingService,
        { provide: DataSource, useValue: dataSource },
        { provide: UsersService, useValue: usersService },
        { provide: PreferencesService, useValue: preferencesService },
        { provide: SelectedCoinsService, useValue: selectedCoinsService },
      ],
    }).compile();

    onboardingService = module.get(OnboardingService);
  });

  it('orchestrates successful onboarding', async () => {
    const result = await onboardingService.completeOnboarding(
      userId,
      completeDto,
    );

    expect(result.message).toBe('Onboarding completed successfully');
    expect(result.onboardingCompleted).toBe(true);
    expect(result.preferences.investorProfile).toBe(
      InvestorProfile.LONG_TERM_HOLDER,
    );
    expect(result.selectedCoins).toHaveLength(2);
    expect(result.preferences).not.toHaveProperty('id');
    expect(result.preferences).not.toHaveProperty('userId');
    expect(result.selectedCoins[0]).not.toHaveProperty('userId');
  });

  it('creates or updates preferences inside the transaction', async () => {
    await onboardingService.completeOnboarding(userId, completeDto);

    expect(preferencesService.upsertForUserWithManager).toHaveBeenCalledWith(
      manager,
      userId,
      {
        investorProfile: completeDto.investorProfile,
        showMarketPrices: completeDto.showMarketPrices,
        showNews: completeDto.showNews,
        showAiInsight: completeDto.showAiInsight,
        showMeme: completeDto.showMeme,
      },
    );
  });

  it('replaces selected coins inside the transaction', async () => {
    await onboardingService.completeOnboarding(userId, completeDto);

    expect(selectedCoinsService.replaceWithManager).toHaveBeenCalledWith(
      manager,
      userId,
      completeDto.coinIds,
    );
  });

  it('marks onboarding as completed inside the transaction', async () => {
    await onboardingService.completeOnboarding(userId, completeDto);

    expect(usersService.setOnboardingCompletedWithManager).toHaveBeenCalledWith(
      manager,
      userId,
    );
  });

  it('allows repeated onboarding updates', async () => {
    const updatedDto: CompleteOnboardingDto = {
      ...completeDto,
      investorProfile: InvestorProfile.ACTIVE_TRADER,
      coinIds: [2],
    };
    selectedCoinsService.validateActiveCoinIds.mockResolvedValue([ethereum]);
    preferencesService.upsertForUserWithManager.mockResolvedValue({
      ...savedPreferences,
      investorProfile: InvestorProfile.ACTIVE_TRADER,
    });

    const result = await onboardingService.completeOnboarding(
      userId,
      updatedDto,
    );

    expect(result.onboardingCompleted).toBe(true);
    expect(result.preferences.investorProfile).toBe(
      InvestorProfile.ACTIVE_TRADER,
    );
    expect(result.selectedCoins).toHaveLength(1);
  });

  it('rejects invalid or inactive coin IDs before starting a transaction', async () => {
    selectedCoinsService.validateActiveCoinIds.mockRejectedValue(
      new BadRequestException('Invalid or inactive coin IDs: 99'),
    );

    await expect(
      onboardingService.completeOnboarding(userId, completeDto),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('rolls back when preferences update fails', async () => {
    preferencesService.upsertForUserWithManager.mockRejectedValue(
      new Error('preferences failure'),
    );

    await expect(
      onboardingService.completeOnboarding(userId, completeDto),
    ).rejects.toThrow('preferences failure');
  });

  it('rolls back when selected-coins update fails', async () => {
    selectedCoinsService.replaceWithManager.mockRejectedValue(
      new Error('selected coins failure'),
    );

    await expect(
      onboardingService.completeOnboarding(userId, completeDto),
    ).rejects.toThrow('selected coins failure');
  });

  it('rolls back when user update fails', async () => {
    usersService.setOnboardingCompletedWithManager.mockRejectedValue(
      new Error('user update failure'),
    );

    await expect(
      onboardingService.completeOnboarding(userId, completeDto),
    ).rejects.toThrow('user update failure');
  });

  it('returns 404 when the authenticated user no longer exists', async () => {
    usersService.findByIdWithManager.mockRejectedValue(
      new NotFoundException('User not found'),
    );

    await expect(
      onboardingService.completeOnboarding(userId, completeDto),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
