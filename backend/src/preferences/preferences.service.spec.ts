import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QueryFailedError } from 'typeorm';
import { UsersService } from '../users/users.service';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { UserPreference } from './entities/user-preference.entity';
import { InvestorProfile } from './enums/investor-profile.enum';
import { PreferencesService } from './preferences.service';

describe('PreferencesService', () => {
  let preferencesService: PreferencesService;
  let preferencesRepository: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let usersService: { findById: jest.Mock };

  const userId = 1;
  const existingPreference: UserPreference = {
    id: 10,
    userId,
    user: undefined as unknown as UserPreference['user'],
    investorProfile: InvestorProfile.BEGINNER,
    showMarketPrices: true,
    showNews: true,
    showAiInsight: true,
    showMeme: true,
    createdAt: new Date('2026-06-15T12:00:00.000Z'),
    updatedAt: new Date('2026-06-15T12:00:00.000Z'),
  };

  beforeEach(async () => {
    preferencesRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    usersService = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PreferencesService,
        {
          provide: getRepositoryToken(UserPreference),
          useValue: preferencesRepository,
        },
        {
          provide: UsersService,
          useValue: usersService,
        },
      ],
    }).compile();

    preferencesService = module.get(PreferencesService);
  });

  it('creates default preferences lazily on first read', async () => {
    usersService.findById.mockResolvedValue({ id: userId });
    preferencesRepository.findOne.mockResolvedValueOnce(null);
    preferencesRepository.create.mockReturnValue(existingPreference);
    preferencesRepository.save.mockResolvedValue(existingPreference);

    const result = await preferencesService.getPreferences(userId);

    expect(preferencesRepository.create).toHaveBeenCalledWith({
      userId,
      investorProfile: InvestorProfile.BEGINNER,
      showMarketPrices: true,
      showNews: true,
      showAiInsight: true,
      showMeme: true,
    });
    expect(result.investorProfile).toBe(InvestorProfile.BEGINNER);
    expect(result).not.toHaveProperty('user');
    expect(result).not.toHaveProperty('userId');
  });

  it('returns existing preferences without creating duplicates', async () => {
    usersService.findById.mockResolvedValue({ id: userId });
    preferencesRepository.findOne.mockResolvedValue(existingPreference);

    const result = await preferencesService.getPreferences(userId);

    expect(result.id).toBe(10);
    expect(preferencesRepository.create).not.toHaveBeenCalled();
    expect(preferencesRepository.save).not.toHaveBeenCalled();
  });

  it('updates only supplied fields', async () => {
    usersService.findById.mockResolvedValue({ id: userId });
    preferencesRepository.findOne.mockResolvedValue({ ...existingPreference });
    preferencesRepository.save.mockImplementation(
      (preference: UserPreference) => Promise.resolve(preference),
    );

    const updateDto: UpdatePreferencesDto = {
      investorProfile: InvestorProfile.LONG_TERM_HOLDER,
      showMeme: false,
    };

    const result = await preferencesService.updatePreferences(
      userId,
      updateDto,
    );

    expect(result.preferences.investorProfile).toBe(
      InvestorProfile.LONG_TERM_HOLDER,
    );
    expect(result.preferences.showMeme).toBe(false);
    expect(result.preferences.showNews).toBe(true);
    expect(result.message).toBe('Preferences updated successfully');
  });

  it('rejects empty update bodies', async () => {
    await expect(
      preferencesService.updatePreferences(userId, {}),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns 404 when the authenticated user no longer exists', async () => {
    usersService.findById.mockRejectedValue(
      new NotFoundException('User not found'),
    );

    await expect(
      preferencesService.getPreferences(userId),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('handles duplicate preference creation safely', async () => {
    usersService.findById.mockResolvedValue({ id: userId });
    preferencesRepository.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(existingPreference);
    preferencesRepository.create.mockReturnValue(existingPreference);
    preferencesRepository.save.mockRejectedValue(
      new QueryFailedError('INSERT', [], {
        code: '23505',
      } as unknown as Error),
    );

    const result = await preferencesService.getPreferences(userId);

    expect(result.id).toBe(10);
  });
});
