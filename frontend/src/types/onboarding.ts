import type { Coin } from './coin';

export type InvestorProfile =
  | 'BEGINNER'
  | 'LONG_TERM_HOLDER'
  | 'ACTIVE_TRADER'
  | 'CRYPTO_ENTHUSIAST';

export interface ContentPreferences {
  showMarketPrices: boolean;
  showNews: boolean;
  showAiInsight: boolean;
  showMeme: boolean;
}

export interface CompleteOnboardingInput {
  investorProfile: InvestorProfile;
  showMarketPrices: boolean;
  showNews: boolean;
  showAiInsight: boolean;
  showMeme: boolean;
  coinIds: number[];
}

export interface OnboardingPreferencesResponse {
  investorProfile: InvestorProfile;
  showMarketPrices: boolean;
  showNews: boolean;
  showAiInsight: boolean;
  showMeme: boolean;
}

export interface CompleteOnboardingResponse {
  message: string;
  onboardingCompleted: boolean;
  preferences: OnboardingPreferencesResponse;
  selectedCoins: Coin[];
}

export type OnboardingStep = 1 | 2 | 3;

export interface OnboardingFormState {
  step: OnboardingStep;
  investorProfile: InvestorProfile | null;
  showMarketPrices: boolean;
  showNews: boolean;
  showAiInsight: boolean;
  showMeme: boolean;
  selectedCoinIds: number[];
}
