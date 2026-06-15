import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { toCoinItemDto } from '../coins/mappers/coin-response.mapper';
import { PreferencesService } from '../preferences/preferences.service';
import { SelectedCoinsService } from '../selected-coins/selected-coins.service';
import { UsersService } from '../users/users.service';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';
import { toOnboardingPreferencesDto } from './mappers/onboarding-response.mapper';

@Injectable()
export class OnboardingService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly usersService: UsersService,
    private readonly preferencesService: PreferencesService,
    private readonly selectedCoinsService: SelectedCoinsService,
  ) {}

  async completeOnboarding(userId: number, completeDto: CompleteOnboardingDto) {
    const validatedCoins =
      await this.selectedCoinsService.validateActiveCoinIds(
        completeDto.coinIds,
      );

    const result = await this.dataSource.transaction(async (manager) => {
      await this.usersService.findByIdWithManager(manager, userId);

      const preferences =
        await this.preferencesService.upsertForUserWithManager(
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

      await this.selectedCoinsService.replaceWithManager(
        manager,
        userId,
        completeDto.coinIds,
      );

      await this.usersService.setOnboardingCompletedWithManager(
        manager,
        userId,
      );

      return {
        message: 'Onboarding completed successfully',
        onboardingCompleted: true,
        preferences: toOnboardingPreferencesDto(preferences),
        selectedCoins: validatedCoins.map(toCoinItemDto),
      };
    });

    return result;
  }
}
