import { describe, expect, it } from 'vitest';
import {
  buildOnboardingRequest,
  mapOnboardingErrorMessage,
  validateStep,
  validateStep1,
  validateStep3,
} from './onboarding-validation';
import type { OnboardingFormState } from '../types/onboarding';

const baseState: OnboardingFormState = {
  step: 1,
  investorProfile: null,
  showMarketPrices: true,
  showNews: true,
  showAiInsight: true,
  showMeme: true,
  selectedCoinIds: [],
};

describe('onboarding-validation', () => {
  it('requires investor profile on step 1', () => {
    expect(validateStep1(baseState)).toBe('Please complete this step before continuing.');
    expect(
      validateStep1({ ...baseState, investorProfile: 'BEGINNER' }),
    ).toBeNull();
  });

  it('requires at least one coin on step 3', () => {
    expect(validateStep3({ ...baseState, selectedCoinIds: [] }, true)).toBe(
      'Please select at least one coin.',
    );
    expect(validateStep3({ ...baseState, selectedCoinIds: [1] }, true)).toBeNull();
  });

  it('rejects duplicate coin IDs', () => {
    expect(
      validateStep3({ ...baseState, selectedCoinIds: [1, 1] }, true),
    ).toBe('Duplicate coin selections are not allowed.');
  });

  it('builds exact backend request fields', () => {
    const request = buildOnboardingRequest({
      ...baseState,
      investorProfile: 'ACTIVE_TRADER',
      showMeme: false,
      selectedCoinIds: [2, 5],
    });

    expect(request).toEqual({
      investorProfile: 'ACTIVE_TRADER',
      showMarketPrices: true,
      showNews: true,
      showAiInsight: true,
      showMeme: false,
      coinIds: [2, 5],
    });
    expect(request).not.toHaveProperty('userId');
    expect(request).not.toHaveProperty('onboardingCompleted');
  });

  it('maps backend 400 coin errors safely', () => {
    expect(
      mapOnboardingErrorMessage(400, ['One or more coin IDs are invalid or inactive']),
    ).toBe('One or more selected coins are no longer available.');
  });

  it('validates steps through validateStep helper', () => {
    expect(validateStep(1, baseState, false)).toBeTruthy();
    expect(validateStep(2, baseState, false)).toBeNull();
    expect(validateStep(3, { ...baseState, selectedCoinIds: [1] }, true)).toBeNull();
  });
});
