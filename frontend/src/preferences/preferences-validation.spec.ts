import { describe, expect, it } from 'vitest';
import {
  buildPreferencesUpdatePayload,
  hasCoinChanges,
  hasFormChanges,
  hasPreferencesChanges,
  orderSelectedCoinIds,
  resolveSaveMessage,
  validatePreferencesForm,
} from './preferences-validation';
import type { PreferencesFormState } from '../types/preferences';

const baseForm: PreferencesFormState = {
  investorProfile: 'LONG_TERM_HOLDER',
  showMarketPrices: true,
  showNews: true,
  showAiInsight: true,
  showMeme: false,
  selectedCoinIds: [1, 2],
};

describe('preferences validation', () => {
  it('requires at least one selected coin', () => {
    expect(
      validatePreferencesForm({
        ...baseForm,
        selectedCoinIds: [],
      }),
    ).toBe('Please select at least one coin.');
  });

  it('builds a partial preferences payload with only changed fields', () => {
    const payload = buildPreferencesUpdatePayload(
      { ...baseForm, showMeme: true, investorProfile: 'ACTIVE_TRADER' },
      baseForm,
    );

    expect(payload).toEqual({
      investorProfile: 'ACTIVE_TRADER',
      showMeme: true,
    });
  });

  it('detects preference and coin changes independently', () => {
    const saved = baseForm;
    const profileChanged = { ...saved, investorProfile: 'BEGINNER' as const };
    const coinsChanged = { ...saved, selectedCoinIds: [1, 2, 3] };

    expect(hasPreferencesChanges(profileChanged, saved)).toBe(true);
    expect(hasCoinChanges(profileChanged, saved)).toBe(false);
    expect(hasCoinChanges(coinsChanged, saved)).toBe(true);
    expect(hasFormChanges(coinsChanged, saved)).toBe(true);
  });

  it('orders selected coin ids by catalog order', () => {
    const ordered = orderSelectedCoinIds(
      [3, 1],
      [
        { id: 1, coingeckoId: 'bitcoin', symbol: 'btc', name: 'Bitcoin' },
        { id: 2, coingeckoId: 'ethereum', symbol: 'eth', name: 'Ethereum' },
        { id: 3, coingeckoId: 'solana', symbol: 'sol', name: 'Solana' },
      ],
    );

    expect(ordered).toEqual([1, 3]);
  });

  it('resolves partial save messages', () => {
    expect(resolveSaveMessage('success', 'failed')).toEqual({
      outcome: 'partial',
      message:
        'Your profile settings were saved, but selected coins could not be updated.',
    });
    expect(resolveSaveMessage('failed', 'success')).toEqual({
      outcome: 'partial',
      message:
        'Your selected coins were saved, but dashboard content settings could not be updated.',
    });
  });
});
