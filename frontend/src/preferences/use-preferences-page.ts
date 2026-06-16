import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ApiError, normalizeApiError } from '../api/api-error';
import { getSupportedCoins } from '../api/coins';
import { getPreferences, updatePreferences } from '../api/preferences';
import { getSelectedCoins, replaceSelectedCoins } from '../api/selected-coins';
import type { Coin } from '../types/coin';
import type { ContentPreferences, InvestorProfile } from '../types/onboarding';
import type { PreferencesFormState } from '../types/preferences';
import {
  buildPreferencesUpdatePayload,
  hasCoinChanges,
  hasFormChanges,
  hasPreferencesChanges,
  mapPreferencesErrorMessage,
  orderSelectedCoinIds,
  resolveSaveMessage,
  validatePreferencesForm,
  type SaveOutcome,
} from './preferences-validation';

export type PreferencesLoadPhase = 'initial' | 'ready' | 'error';

interface UsePreferencesPageResult {
  form: PreferencesFormState | null;
  supportedCoins: Coin[];
  phase: PreferencesLoadPhase;
  loadError: ApiError | null;
  formError: string | null;
  saveMessage: string | null;
  saveOutcome: SaveOutcome | null;
  hasChanges: boolean;
  canSave: boolean;
  isSaving: boolean;
  setInvestorProfile: (profile: InvestorProfile) => void;
  togglePreference: (key: keyof ContentPreferences) => void;
  toggleCoin: (coinId: number) => void;
  save: () => Promise<void>;
  discardChanges: () => void;
  retryLoad: () => Promise<void>;
}

function toggleCoinIds(coinIds: number[], coinId: number): number[] {
  return coinIds.includes(coinId)
    ? coinIds.filter((id) => id !== coinId)
    : [...coinIds, coinId];
}

function buildFormState(
  preferences: {
    investorProfile: InvestorProfile;
    showMarketPrices: boolean;
    showNews: boolean;
    showAiInsight: boolean;
    showMeme: boolean;
  },
  selectedCoinIds: number[],
): PreferencesFormState {
  return {
    investorProfile: preferences.investorProfile,
    showMarketPrices: preferences.showMarketPrices,
    showNews: preferences.showNews,
    showAiInsight: preferences.showAiInsight,
    showMeme: preferences.showMeme,
    selectedCoinIds,
  };
}

export function usePreferencesPage(): UsePreferencesPageResult {
  const [form, setForm] = useState<PreferencesFormState | null>(null);
  const [savedForm, setSavedForm] = useState<PreferencesFormState | null>(null);
  const [supportedCoins, setSupportedCoins] = useState<Coin[]>([]);
  const [phase, setPhase] = useState<PreferencesLoadPhase>('initial');
  const [loadError, setLoadError] = useState<ApiError | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveOutcome, setSaveOutcome] = useState<SaveOutcome | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const applyLoadedState = useCallback(
    (
      preferences: Awaited<ReturnType<typeof getPreferences>>,
      selectedItems: Awaited<ReturnType<typeof getSelectedCoins>>['items'],
      catalog: Coin[],
    ) => {
      const selectedCoinIds = orderSelectedCoinIds(
        selectedItems.map((coin) => coin.id),
        catalog,
      );
      const nextForm = buildFormState(preferences, selectedCoinIds);
      setSupportedCoins(catalog);
      setForm(nextForm);
      setSavedForm(nextForm);
      setPhase('ready');
      setLoadError(null);
    },
    [],
  );

  const loadPageData = useCallback(async () => {
    setPhase('initial');
    setLoadError(null);
    setFormError(null);
    setSaveMessage(null);
    setSaveOutcome(null);

    try {
      const [preferences, selectedCoins, coinsResponse] = await Promise.all([
        getPreferences(),
        getSelectedCoins(),
        getSupportedCoins(),
      ]);

      if (!isMountedRef.current) {
        return;
      }

      applyLoadedState(preferences, selectedCoins.items, coinsResponse.items);
    } catch (caughtError) {
      if (!isMountedRef.current) {
        return;
      }

      const apiError = normalizeApiError(caughtError);

      if (apiError.statusCode === 401) {
        return;
      }

      setLoadError(apiError);
      setPhase('error');
    }
  }, [applyLoadedState]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on mount
    void loadPageData();
  }, [loadPageData]);

  const hasChanges = useMemo(() => {
    if (!form || !savedForm) {
      return false;
    }

    return hasFormChanges(form, savedForm);
  }, [form, savedForm]);

  const canSave = Boolean(form && savedForm && hasChanges && !isSaving && phase === 'ready');

  const setInvestorProfile = useCallback((profile: InvestorProfile) => {
    setFormError(null);
    setSaveMessage(null);
    setSaveOutcome(null);
    setForm((current) => (current ? { ...current, investorProfile: profile } : current));
  }, []);

  const togglePreference = useCallback((key: keyof ContentPreferences) => {
    setFormError(null);
    setSaveMessage(null);
    setSaveOutcome(null);
    setForm((current) =>
      current ? { ...current, [key]: !current[key] } : current,
    );
  }, []);

  const toggleCoin = useCallback((coinId: number) => {
    setFormError(null);
    setSaveMessage(null);
    setSaveOutcome(null);
    setForm((current) => {
      if (!current) {
        return current;
      }

      const nextIds = orderSelectedCoinIds(
        toggleCoinIds(current.selectedCoinIds, coinId),
        supportedCoins,
      );

      return { ...current, selectedCoinIds: nextIds };
    });
  }, [supportedCoins]);

  const discardChanges = useCallback(() => {
    if (!savedForm) {
      return;
    }

    setForm(savedForm);
    setFormError(null);
    setSaveMessage(null);
    setSaveOutcome(null);
  }, [savedForm]);

  const save = useCallback(async () => {
    if (!form || !savedForm || !canSave) {
      return;
    }

    const validationMessage = validatePreferencesForm(form);
    if (validationMessage) {
      setFormError(validationMessage);
      setSaveMessage(null);
      setSaveOutcome(null);
      return;
    }

    const preferencesChanged = hasPreferencesChanges(form, savedForm);
    const coinsChanged = hasCoinChanges(form, savedForm);

    if (!preferencesChanged && !coinsChanged) {
      return;
    }

    setIsSaving(true);
    setFormError(null);
    setSaveMessage(null);
    setSaveOutcome(null);

    let preferencesResult: 'skipped' | 'success' | 'failed' = 'skipped';
    let coinsResult: 'skipped' | 'success' | 'failed' = 'skipped';

    const saveTasks: Promise<void>[] = [];

    if (preferencesChanged) {
      saveTasks.push(
        updatePreferences(buildPreferencesUpdatePayload(form, savedForm))
          .then(() => {
            preferencesResult = 'success';
          })
          .catch(() => {
            preferencesResult = 'failed';
          }),
      );
    }

    if (coinsChanged) {
      saveTasks.push(
        replaceSelectedCoins({ coinIds: [...form.selectedCoinIds] })
          .then(() => {
            coinsResult = 'success';
          })
          .catch(() => {
            coinsResult = 'failed';
          }),
      );
    }

    await Promise.all(saveTasks);

    try {
      const [preferences, selectedCoins, coinsResponse] = await Promise.all([
        getPreferences(),
        getSelectedCoins(),
        getSupportedCoins(),
      ]);

      if (!isMountedRef.current) {
        return;
      }

      applyLoadedState(preferences, selectedCoins.items, coinsResponse.items);
    } catch (caughtError) {
      if (!isMountedRef.current) {
        return;
      }

      const apiError = normalizeApiError(caughtError);
      setFormError(mapPreferencesErrorMessage(apiError.statusCode, apiError.validationMessages));
      setIsSaving(false);
      return;
    }

    const { outcome, message } = resolveSaveMessage(preferencesResult, coinsResult);
    setSaveOutcome(outcome);
    setSaveMessage(message);
    setIsSaving(false);
  }, [applyLoadedState, canSave, form, savedForm]);

  return {
    form,
    supportedCoins,
    phase,
    loadError,
    formError,
    saveMessage,
    saveOutcome,
    hasChanges,
    canSave,
    isSaving,
    setInvestorProfile,
    togglePreference,
    toggleCoin,
    save,
    discardChanges,
    retryLoad: loadPageData,
  };
}
