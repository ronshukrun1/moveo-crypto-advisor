import type { PreferencesRecord } from '../types/preferences';

export const mockPreferencesRecord: PreferencesRecord = {
  id: 1,
  investorProfile: 'LONG_TERM_HOLDER',
  showMarketPrices: true,
  showNews: true,
  showAiInsight: true,
  showMeme: false,
  createdAt: '2026-06-15T12:00:00.000Z',
  updatedAt: '2026-06-15T12:00:00.000Z',
};

export const mockSupportedCoins = {
  items: [
    { id: 1, coingeckoId: 'bitcoin', symbol: 'btc', name: 'Bitcoin' },
    { id: 2, coingeckoId: 'ethereum', symbol: 'eth', name: 'Ethereum' },
    { id: 3, coingeckoId: 'solana', symbol: 'sol', name: 'Solana' },
  ],
};

export const mockSelectedCoins = {
  items: [
    { id: 1, coingeckoId: 'bitcoin', symbol: 'btc', name: 'Bitcoin' },
    { id: 2, coingeckoId: 'ethereum', symbol: 'eth', name: 'Ethereum' },
  ],
};

export function createPreferencesRecord(
  overrides: Partial<PreferencesRecord> = {},
): PreferencesRecord {
  return {
    ...mockPreferencesRecord,
    ...overrides,
  };
}
