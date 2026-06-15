import { UserPreference } from '../../preferences/entities/user-preference.entity';
import { OnboardingPreferencesDto } from '../dto/onboarding-response.dto';

export function toOnboardingPreferencesDto(
  preference: UserPreference,
): OnboardingPreferencesDto {
  return {
    investorProfile: preference.investorProfile,
    showMarketPrices: preference.showMarketPrices,
    showNews: preference.showNews,
    showAiInsight: preference.showAiInsight,
    showMeme: preference.showMeme,
  };
}
