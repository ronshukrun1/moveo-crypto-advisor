import { useCallback, useReducer } from 'react';
import type {
  ContentPreferences,
  InvestorProfile,
  OnboardingFormState,
  OnboardingStep,
} from '../types/onboarding';
import { DEFAULT_CONTENT_PREFERENCES } from './constants';

type OnboardingAction =
  | { type: 'SET_STEP'; step: OnboardingStep }
  | { type: 'SET_INVESTOR_PROFILE'; profile: InvestorProfile }
  | { type: 'TOGGLE_PREFERENCE'; key: keyof ContentPreferences }
  | { type: 'TOGGLE_COIN'; coinId: number }
  | { type: 'RESET' };

const initialState: OnboardingFormState = {
  step: 1,
  investorProfile: null,
  ...DEFAULT_CONTENT_PREFERENCES,
  selectedCoinIds: [],
};

function toggleCoinIds(coinIds: number[], coinId: number): number[] {
  return coinIds.includes(coinId)
    ? coinIds.filter((id) => id !== coinId)
    : [...coinIds, coinId];
}

function onboardingReducer(
  state: OnboardingFormState,
  action: OnboardingAction,
): OnboardingFormState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, step: action.step };
    case 'SET_INVESTOR_PROFILE':
      return { ...state, investorProfile: action.profile };
    case 'TOGGLE_PREFERENCE':
      return { ...state, [action.key]: !state[action.key] };
    case 'TOGGLE_COIN':
      return {
        ...state,
        selectedCoinIds: toggleCoinIds(state.selectedCoinIds, action.coinId),
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

export function useOnboardingFlow() {
  const [state, dispatch] = useReducer(onboardingReducer, initialState);

  const setStep = useCallback((step: OnboardingStep) => {
    dispatch({ type: 'SET_STEP', step });
  }, []);

  const setInvestorProfile = useCallback((profile: InvestorProfile) => {
    dispatch({ type: 'SET_INVESTOR_PROFILE', profile });
  }, []);

  const togglePreference = useCallback((key: keyof ContentPreferences) => {
    dispatch({ type: 'TOGGLE_PREFERENCE', key });
  }, []);

  const toggleCoin = useCallback((coinId: number) => {
    dispatch({ type: 'TOGGLE_COIN', coinId });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  return {
    state,
    setStep,
    setInvestorProfile,
    togglePreference,
    toggleCoin,
    reset,
  };
}
