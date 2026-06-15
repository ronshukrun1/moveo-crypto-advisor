import { UserPreference } from '../entities/user-preference.entity';
import { PreferencesResponseDto } from '../dto/preferences-response.dto';

export function toPreferencesResponseDto(
  preference: UserPreference,
): PreferencesResponseDto {
  return {
    id: preference.id,
    investorProfile: preference.investorProfile,
    showMarketPrices: preference.showMarketPrices,
    showNews: preference.showNews,
    showAiInsight: preference.showAiInsight,
    showMeme: preference.showMeme,
    createdAt: preference.createdAt,
    updatedAt: preference.updatedAt,
  };
}
