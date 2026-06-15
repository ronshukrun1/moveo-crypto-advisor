import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, QueryFailedError, Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { UserPreference } from './entities/user-preference.entity';
import { InvestorProfile } from './enums/investor-profile.enum';
import { toPreferencesResponseDto } from './mappers/preferences-response.mapper';

@Injectable()
export class PreferencesService {
  constructor(
    @InjectRepository(UserPreference)
    private readonly preferencesRepository: Repository<UserPreference>,
    private readonly usersService: UsersService,
  ) {}

  async getPreferences(userId: number) {
    const preferences = await this.getOrCreateForUser(userId);
    return toPreferencesResponseDto(preferences);
  }

  async updatePreferences(userId: number, updateDto: UpdatePreferencesDto) {
    if (!this.hasUpdateFields(updateDto)) {
      throw new BadRequestException(
        'At least one preference field must be provided',
      );
    }

    const preferences = await this.getOrCreateForUser(userId);

    if (updateDto.investorProfile !== undefined) {
      preferences.investorProfile = updateDto.investorProfile;
    }
    if (updateDto.showMarketPrices !== undefined) {
      preferences.showMarketPrices = updateDto.showMarketPrices;
    }
    if (updateDto.showNews !== undefined) {
      preferences.showNews = updateDto.showNews;
    }
    if (updateDto.showAiInsight !== undefined) {
      preferences.showAiInsight = updateDto.showAiInsight;
    }
    if (updateDto.showMeme !== undefined) {
      preferences.showMeme = updateDto.showMeme;
    }

    const savedPreferences = await this.preferencesRepository.save(preferences);

    return {
      message: 'Preferences updated successfully',
      preferences: toPreferencesResponseDto(savedPreferences),
    };
  }

  async upsertForUserWithManager(
    manager: EntityManager,
    userId: number,
    data: {
      investorProfile: InvestorProfile;
      showMarketPrices: boolean;
      showNews: boolean;
      showAiInsight: boolean;
      showMeme: boolean;
    },
  ): Promise<UserPreference> {
    const repository = manager.getRepository(UserPreference);
    const existingPreferences = await repository.findOne({ where: { userId } });

    if (existingPreferences) {
      existingPreferences.investorProfile = data.investorProfile;
      existingPreferences.showMarketPrices = data.showMarketPrices;
      existingPreferences.showNews = data.showNews;
      existingPreferences.showAiInsight = data.showAiInsight;
      existingPreferences.showMeme = data.showMeme;

      return repository.save(existingPreferences);
    }

    const preferences = repository.create({
      userId,
      ...data,
    });

    return repository.save(preferences);
  }

  private async getOrCreateForUser(userId: number): Promise<UserPreference> {
    try {
      await this.usersService.findById(userId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException('User not found');
      }

      throw error;
    }

    const existingPreferences = await this.preferencesRepository.findOne({
      where: { userId },
    });

    if (existingPreferences) {
      return existingPreferences;
    }

    try {
      const preferences = this.preferencesRepository.create({
        userId,
        investorProfile: InvestorProfile.BEGINNER,
        showMarketPrices: true,
        showNews: true,
        showAiInsight: true,
        showMeme: true,
      });

      return await this.preferencesRepository.save(preferences);
    } catch (error) {
      if (this.isUniqueUserIdViolation(error)) {
        const preferences = await this.preferencesRepository.findOne({
          where: { userId },
        });

        if (preferences) {
          return preferences;
        }
      }

      throw error;
    }
  }

  private hasUpdateFields(updateDto: UpdatePreferencesDto): boolean {
    return (
      updateDto.investorProfile !== undefined ||
      updateDto.showMarketPrices !== undefined ||
      updateDto.showNews !== undefined ||
      updateDto.showAiInsight !== undefined ||
      updateDto.showMeme !== undefined
    );
  }

  private isUniqueUserIdViolation(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }

    const driverError = error.driverError as { code?: string };
    return driverError.code === '23505';
  }
}
