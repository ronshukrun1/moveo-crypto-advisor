import {
  buildInsightContextHash,
  buildMemeContextHash,
  getUtcDateString,
} from './daily-content.utils';

describe('daily content utils', () => {
  it('uses the current UTC calendar date', () => {
    expect(getUtcDateString(new Date('2026-06-16T23:30:00.000Z'))).toBe(
      '2026-06-16',
    );
  });

  it('builds a stable insight context hash regardless of coin order', () => {
    const first = buildInsightContextHash('LONG_TERM_HOLDER', [2, 1]);
    const second = buildInsightContextHash('LONG_TERM_HOLDER', [1, 2]);

    expect(first).toBe(second);
  });

  it('changes the insight context hash when investor profile changes', () => {
    const first = buildInsightContextHash('LONG_TERM_HOLDER', [1, 2]);
    const second = buildInsightContextHash('BEGINNER', [1, 2]);

    expect(first).not.toBe(second);
  });

  it('builds a stable meme context hash regardless of coin order', () => {
    const first = buildMemeContextHash({
      userId: 1,
      investorProfile: 'LONG_TERM_HOLDER',
      selectedCoinIds: [2, 1],
      templatePoolVersion: '87743020,112126428,181913649',
    });
    const second = buildMemeContextHash({
      userId: 1,
      investorProfile: 'LONG_TERM_HOLDER',
      selectedCoinIds: [1, 2],
      templatePoolVersion: '87743020,112126428,181913649',
    });

    expect(first).toBe(second);
  });

  it('changes the meme context hash when investor profile changes', () => {
    const first = buildMemeContextHash({
      userId: 1,
      investorProfile: 'LONG_TERM_HOLDER',
      selectedCoinIds: [1, 2],
      templatePoolVersion: '87743020,112126428,181913649',
    });
    const second = buildMemeContextHash({
      userId: 1,
      investorProfile: 'BEGINNER',
      selectedCoinIds: [1, 2],
      templatePoolVersion: '87743020,112126428,181913649',
    });

    expect(first).not.toBe(second);
  });

  it('changes the meme context hash when the template pool version changes', () => {
    const first = buildMemeContextHash({
      userId: 1,
      investorProfile: 'LONG_TERM_HOLDER',
      selectedCoinIds: [1, 2],
      templatePoolVersion: '87743020,112126428,181913649',
    });
    const second = buildMemeContextHash({
      userId: 1,
      investorProfile: 'LONG_TERM_HOLDER',
      selectedCoinIds: [1, 2],
      templatePoolVersion: '112126428,87743020',
    });

    expect(first).not.toBe(second);
  });
});
