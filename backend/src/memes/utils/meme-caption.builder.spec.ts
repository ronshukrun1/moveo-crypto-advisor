import { InvestorProfile } from '../../preferences/enums/investor-profile.enum';
import {
  buildMemeCaptions,
  getEligibleCaptionVariationIds,
  getMovementCategory,
} from './meme-caption.builder';

describe('meme caption builder', () => {
  it('uses positive caption families for positive movement', () => {
    const eligible = getEligibleCaptionVariationIds(
      'positive',
      InvestorProfile.BEGINNER,
    );

    expect(eligible.some((id) => id.startsWith('positive-'))).toBe(true);
    expect(eligible.every((id) => id.startsWith('positive-'))).toBe(true);
  });

  it('uses negative caption families for negative movement', () => {
    const eligible = getEligibleCaptionVariationIds(
      'negative',
      InvestorProfile.ACTIVE_TRADER,
    );

    expect(eligible.every((id) => id.startsWith('negative-'))).toBe(true);
  });

  it('uses neutral fallback captions when percentage is missing', () => {
    const captions = buildMemeCaptions(
      [
        { symbol: 'btc', name: 'Bitcoin', changePercentage24h: null },
        { symbol: 'eth', name: 'Ethereum', changePercentage24h: null },
      ],
      InvestorProfile.BEGINNER,
      'neutral-beginner-learning',
    );

    expect(captions.textTop).toBe('BTC is on my watchlist');
    expect(captions.textBottom).toBe(
      'Learning one dashboard refresh at a time',
    );
  });

  it('builds profile-aware positive captions', () => {
    const captions = buildMemeCaptions(
      [{ symbol: 'btc', name: 'Bitcoin', changePercentage24h: 3.2 }],
      InvestorProfile.LONG_TERM_HOLDER,
      'positive-long-term-pretending',
    );

    expect(captions.textTop).toBe('BTC moved +3.2% today');
    expect(captions.textBottom).toBe(
      'Long-term me pretending I did not check twice',
    );
  });

  it('builds profile-aware negative captions', () => {
    const captions = buildMemeCaptions(
      [{ symbol: 'eth', name: 'Ethereum', changePercentage24h: -4.1 }],
      InvestorProfile.ACTIVE_TRADER,
      'negative-active-trader-candle',
    );

    expect(captions.textTop).toBe('ETH moved -4.1% in 24 hours');
    expect(captions.textBottom).toBe(
      'Me opening the dashboard before the next candle',
    );
  });

  it('can produce different eligible sets for different investor profiles', () => {
    const beginner = getEligibleCaptionVariationIds(
      getMovementCategory(2.2),
      InvestorProfile.BEGINNER,
    );
    const enthusiast = getEligibleCaptionVariationIds(
      getMovementCategory(2.2),
      InvestorProfile.CRYPTO_ENTHUSIAST,
    );

    expect(beginner).not.toEqual(enthusiast);
  });
});
