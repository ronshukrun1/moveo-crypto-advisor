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
    const first = buildMemeContextHash([2, 1], 181913649);
    const second = buildMemeContextHash([1, 2], 181913649);

    expect(first).toBe(second);
  });

  it('changes the meme context hash when template ID changes', () => {
    const first = buildMemeContextHash([1, 2], 181913649);
    const second = buildMemeContextHash([1, 2], 999999);

    expect(first).not.toBe(second);
  });
});
