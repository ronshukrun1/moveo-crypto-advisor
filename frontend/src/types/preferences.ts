import type { ContentPreferences, InvestorProfile } from './onboarding';
import type { Coin } from './coin';

export interface PreferencesRecord extends ContentPreferences {
  id: number;
  investorProfile: InvestorProfile;
  createdAt: string;
  updatedAt: string;
}

export interface UpdatePreferencesInput {
  investorProfile?: InvestorProfile;
  showMarketPrices?: boolean;
  showNews?: boolean;
  showAiInsight?: boolean;
  showMeme?: boolean;
}

export interface UpdatePreferencesResponse {
  message: string;
  preferences: PreferencesRecord;
}

export interface ReplaceSelectedCoinsInput {
  coinIds: number[];
}

export interface ReplaceSelectedCoinsResponse {
  message: string;
  items: Coin[];
}

export interface PreferencesFormState extends ContentPreferences {
  investorProfile: InvestorProfile;
  selectedCoinIds: number[];
}
