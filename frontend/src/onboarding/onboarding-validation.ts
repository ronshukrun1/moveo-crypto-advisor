import type { OnboardingFormState } from '../types/onboarding';

export function validateStep1(state: OnboardingFormState): string | null {
  if (!state.investorProfile) {
    return 'Please complete this step before continuing.';
  }

  return null;
}

export function validateStep2(): string | null {
  return null;
}

export function validateStep3(
  state: OnboardingFormState,
  coinsLoaded: boolean,
): string | null {
  if (!coinsLoaded) {
    return 'Please wait for coins to load before continuing.';
  }

  if (state.selectedCoinIds.length === 0) {
    return 'Please select at least one coin.';
  }

  const uniqueIds = new Set(state.selectedCoinIds);
  if (uniqueIds.size !== state.selectedCoinIds.length) {
    return 'Duplicate coin selections are not allowed.';
  }

  if (!state.selectedCoinIds.every((id) => Number.isInteger(id) && id > 0)) {
    return 'Please select valid coins.';
  }

  return null;
}

export function validateStep(
  step: OnboardingFormState['step'],
  state: OnboardingFormState,
  coinsLoaded: boolean,
): string | null {
  if (step === 1) {
    return validateStep1(state);
  }

  if (step === 2) {
    return validateStep2();
  }

  return validateStep3(state, coinsLoaded);
}

export function buildOnboardingRequest(state: OnboardingFormState) {
  if (!state.investorProfile) {
    throw new Error('Investor profile is required');
  }

  return {
    investorProfile: state.investorProfile,
    showMarketPrices: state.showMarketPrices,
    showNews: state.showNews,
    showAiInsight: state.showAiInsight,
    showMeme: state.showMeme,
    coinIds: [...state.selectedCoinIds],
  };
}

export function mapOnboardingErrorMessage(
  statusCode?: number,
  validationMessages?: string[],
): string {
  if (statusCode === 400) {
    const joined = validationMessages?.join(' ').toLowerCase() ?? '';

    if (joined.includes('coin')) {
      return 'One or more selected coins are no longer available.';
    }

    return 'Please check your selections and try again.';
  }

  if (statusCode === 404) {
    return 'Your account could not be found. Please sign in again.';
  }

  if (!statusCode) {
    return 'Unable to complete onboarding right now. Please try again.';
  }

  return 'Unable to complete onboarding right now. Please try again.';
}
