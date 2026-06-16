import type { Coin } from '../types/coin';
import type { PreferencesFormState, UpdatePreferencesInput } from '../types/preferences';

export function orderSelectedCoinIds(coinIds: number[], catalog: Coin[]): number[] {
  const selectedIds = new Set(coinIds);
  return catalog.filter((coin) => selectedIds.has(coin.id)).map((coin) => coin.id);
}

export function validatePreferencesForm(form: PreferencesFormState): string | null {
  if (form.selectedCoinIds.length === 0) {
    return 'Please select at least one coin.';
  }

  const uniqueIds = new Set(form.selectedCoinIds);
  if (uniqueIds.size !== form.selectedCoinIds.length) {
    return 'Duplicate coin selections are not allowed.';
  }

  if (!form.selectedCoinIds.every((id) => Number.isInteger(id) && id > 0)) {
    return 'Please select valid coins.';
  }

  return null;
}

export function hasPreferencesChanges(
  current: PreferencesFormState,
  saved: PreferencesFormState,
): boolean {
  return (
    current.investorProfile !== saved.investorProfile ||
    current.showMarketPrices !== saved.showMarketPrices ||
    current.showNews !== saved.showNews ||
    current.showAiInsight !== saved.showAiInsight ||
    current.showMeme !== saved.showMeme
  );
}

export function hasCoinChanges(
  current: PreferencesFormState,
  saved: PreferencesFormState,
): boolean {
  if (current.selectedCoinIds.length !== saved.selectedCoinIds.length) {
    return true;
  }

  return current.selectedCoinIds.some(
    (coinId, index) => coinId !== saved.selectedCoinIds[index],
  );
}

export function hasFormChanges(
  current: PreferencesFormState,
  saved: PreferencesFormState,
): boolean {
  return hasPreferencesChanges(current, saved) || hasCoinChanges(current, saved);
}

export function buildPreferencesUpdatePayload(
  current: PreferencesFormState,
  saved: PreferencesFormState,
): UpdatePreferencesInput {
  const payload: UpdatePreferencesInput = {};

  if (current.investorProfile !== saved.investorProfile) {
    payload.investorProfile = current.investorProfile;
  }

  if (current.showMarketPrices !== saved.showMarketPrices) {
    payload.showMarketPrices = current.showMarketPrices;
  }

  if (current.showNews !== saved.showNews) {
    payload.showNews = current.showNews;
  }

  if (current.showAiInsight !== saved.showAiInsight) {
    payload.showAiInsight = current.showAiInsight;
  }

  if (current.showMeme !== saved.showMeme) {
    payload.showMeme = current.showMeme;
  }

  return payload;
}

export function mapPreferencesErrorMessage(
  statusCode?: number,
  validationMessages?: string[],
): string {
  if (statusCode === 400) {
    const joined = validationMessages?.join(' ').toLowerCase() ?? '';

    if (joined.includes('coin')) {
      return 'One or more selected coins are no longer available.';
    }

    return 'Please review your selections.';
  }

  if (statusCode === 404) {
    return 'Your account could not be found. Please sign in again.';
  }

  if (!statusCode) {
    return 'Unable to save your changes right now.';
  }

  return 'Unable to save your changes right now.';
}

export type SaveOutcome = 'success' | 'partial' | 'failure';

export function resolveSaveMessage(
  preferencesResult: 'skipped' | 'success' | 'failed',
  coinsResult: 'skipped' | 'success' | 'failed',
): { outcome: SaveOutcome; message: string } {
  const preferencesFailed = preferencesResult === 'failed';
  const coinsFailed = coinsResult === 'failed';
  const preferencesSucceeded = preferencesResult === 'success';
  const coinsSucceeded = coinsResult === 'success';

  if (preferencesFailed && coinsFailed) {
    return {
      outcome: 'failure',
      message: 'Unable to save your changes right now.',
    };
  }

  if (preferencesFailed && coinsSucceeded) {
    return {
      outcome: 'partial',
      message:
        'Your selected coins were saved, but dashboard content settings could not be updated.',
    };
  }

  if (preferencesSucceeded && coinsFailed) {
    return {
      outcome: 'partial',
      message:
        'Your profile settings were saved, but selected coins could not be updated.',
    };
  }

  if (preferencesSucceeded || coinsSucceeded) {
    return {
      outcome: 'success',
      message: 'Your preferences were updated successfully.',
    };
  }

  return {
    outcome: 'failure',
    message: 'Unable to save your changes right now.',
  };
}
