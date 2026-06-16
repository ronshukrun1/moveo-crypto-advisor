import { InvestorProfile } from '../../preferences/enums/investor-profile.enum';

export interface MemeMarketItem {
  symbol: string;
  name: string;
  changePercentage24h: number | null;
}

export interface MemeCaptions {
  textTop: string;
  textBottom: string;
}

export type MovementCategory = 'positive' | 'negative' | 'neutral';

export interface CaptionBuildContext {
  symbol: string;
  name: string;
  changePercentage24h: number | null;
  investorProfile: string;
  movement: MovementCategory;
}

interface MemeCaptionVariationDefinition {
  id: string;
  movements: MovementCategory[];
  profiles: string[];
  build: (context: CaptionBuildContext) => MemeCaptions;
}

const RECOMMENDATION_PATTERNS = [
  /\bbuy\b/i,
  /\bsell\b/i,
  /\bhold\b/i,
  /\binvestment opportunity\b/i,
  /\bguaranteed return\b/i,
  /\bguaranteed\b/i,
  /\bprofit\b/i,
  /\bopportunity\b/i,
  /\bprediction\b/i,
  /\brecommendation\b/i,
];

const ALL_PROFILES = Object.values(InvestorProfile);

function formatPercentage(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  const normalized = Object.is(rounded, -0) ? 0 : rounded;
  const prefix = normalized > 0 ? '+' : '';

  return `${prefix}${normalized}%`;
}

function containsRecommendationLanguage(text: string): boolean {
  return RECOMMENDATION_PATTERNS.some((pattern) => pattern.test(text));
}

export function getMovementCategory(
  changePercentage24h: number | null,
): MovementCategory {
  if (changePercentage24h === null || changePercentage24h === 0) {
    return 'neutral';
  }

  return changePercentage24h > 0 ? 'positive' : 'negative';
}

const MEME_CAPTION_VARIATIONS: MemeCaptionVariationDefinition[] = [
  {
    id: 'positive-general-moved-24h',
    movements: ['positive'],
    profiles: ALL_PROFILES,
    build: ({ symbol, changePercentage24h }) => ({
      textTop: `${symbol} moved ${formatPercentage(changePercentage24h as number)} in 24 hours`,
      textBottom: 'Me checking the dashboard again',
    }),
  },
  {
    id: 'positive-general-calm-reaction',
    movements: ['positive'],
    profiles: ALL_PROFILES,
    build: ({ symbol, changePercentage24h }) => ({
      textTop: `${symbol} today: ${formatPercentage(changePercentage24h as number)}`,
      textBottom: 'My calm and completely normal reaction',
    }),
  },
  {
    id: 'positive-general-watching-move',
    movements: ['positive'],
    profiles: ALL_PROFILES,
    build: ({ symbol, changePercentage24h }) => ({
      textTop: `Watching ${symbol} move ${formatPercentage(changePercentage24h as number)}`,
      textBottom: 'Opening the dashboard one more time',
    }),
  },
  {
    id: 'positive-long-term-pretending',
    movements: ['positive'],
    profiles: [InvestorProfile.LONG_TERM_HOLDER],
    build: ({ symbol, changePercentage24h }) => ({
      textTop: `${symbol} moved ${formatPercentage(changePercentage24h as number)} today`,
      textBottom: 'Long-term me pretending I did not check twice',
    }),
  },
  {
    id: 'positive-long-term-patience',
    movements: ['positive'],
    profiles: [InvestorProfile.LONG_TERM_HOLDER],
    build: ({ symbol, changePercentage24h }) => ({
      textTop: `Watching ${symbol} move ${formatPercentage(changePercentage24h as number)}`,
      textBottom: 'Long-term patience, short-term refreshing',
    }),
  },
  {
    id: 'positive-active-trader-candle',
    movements: ['positive'],
    profiles: [InvestorProfile.ACTIVE_TRADER],
    build: ({ symbol, changePercentage24h }) => ({
      textTop: `${symbol} moved ${formatPercentage(changePercentage24h as number)} in 24 hours`,
      textBottom: 'Me opening the dashboard before the next candle',
    }),
  },
  {
    id: 'positive-active-trader-volatility',
    movements: ['positive'],
    profiles: [InvestorProfile.ACTIVE_TRADER],
    build: ({ symbol, changePercentage24h }) => ({
      textTop: `${symbol} today: ${formatPercentage(changePercentage24h as number)}`,
      textBottom: 'Trying to stay calm during volatility',
    }),
  },
  {
    id: 'positive-beginner-learning',
    movements: ['positive'],
    profiles: [InvestorProfile.BEGINNER],
    build: ({ symbol, changePercentage24h }) => ({
      textTop: `${symbol} moved ${formatPercentage(changePercentage24h as number)} today`,
      textBottom: 'Learning one dashboard refresh at a time',
    }),
  },
  {
    id: 'positive-beginner-curious',
    movements: ['positive'],
    profiles: [InvestorProfile.BEGINNER],
    build: ({ name, changePercentage24h }) => ({
      textTop: `${name} moved ${formatPercentage(changePercentage24h as number)} in 24 hours`,
      textBottom: 'Just curious what happened today',
    }),
  },
  {
    id: 'positive-enthusiast-watching',
    movements: ['positive'],
    profiles: [InvestorProfile.CRYPTO_ENTHUSIAST],
    build: ({ symbol, changePercentage24h }) => ({
      textTop: `${symbol} is up ${formatPercentage(changePercentage24h as number)}`,
      textBottom: 'Me watching market activity closely',
    }),
  },
  {
    id: 'positive-enthusiast-curiosity',
    movements: ['positive'],
    profiles: [InvestorProfile.CRYPTO_ENTHUSIAST],
    build: ({ symbol, changePercentage24h }) => ({
      textTop: `Watching ${symbol} move ${formatPercentage(changePercentage24h as number)}`,
      textBottom: 'Crypto curiosity got me again',
    }),
  },
  {
    id: 'negative-general-moved-24h',
    movements: ['negative'],
    profiles: ALL_PROFILES,
    build: ({ symbol, changePercentage24h }) => ({
      textTop: `${symbol} moved ${formatPercentage(changePercentage24h as number)} in 24 hours`,
      textBottom: 'Me checking the dashboard again',
    }),
  },
  {
    id: 'negative-general-stay-calm',
    movements: ['negative'],
    profiles: ALL_PROFILES,
    build: ({ symbol, changePercentage24h }) => ({
      textTop: `${symbol} today: ${formatPercentage(changePercentage24h as number)}`,
      textBottom: 'Trying to stay calm during volatility',
    }),
  },
  {
    id: 'negative-general-watching',
    movements: ['negative'],
    profiles: ALL_PROFILES,
    build: ({ symbol, changePercentage24h }) => ({
      textTop: `Watching ${symbol} move ${formatPercentage(changePercentage24h as number)}`,
      textBottom: 'Opening the dashboard one more time',
    }),
  },
  {
    id: 'negative-long-term-patience',
    movements: ['negative'],
    profiles: [InvestorProfile.LONG_TERM_HOLDER],
    build: ({ symbol, changePercentage24h }) => ({
      textTop: `${symbol} moved ${formatPercentage(changePercentage24h as number)} today`,
      textBottom: 'Long-term patience in progress',
    }),
  },
  {
    id: 'negative-long-term-pretending',
    movements: ['negative'],
    profiles: [InvestorProfile.LONG_TERM_HOLDER],
    build: ({ symbol, changePercentage24h }) => ({
      textTop: `${symbol} today: ${formatPercentage(changePercentage24h as number)}`,
      textBottom: 'Long-term me pretending I did not check twice',
    }),
  },
  {
    id: 'negative-active-trader-candle',
    movements: ['negative'],
    profiles: [InvestorProfile.ACTIVE_TRADER],
    build: ({ symbol, changePercentage24h }) => ({
      textTop: `${symbol} moved ${formatPercentage(changePercentage24h as number)} in 24 hours`,
      textBottom: 'Me opening the dashboard before the next candle',
    }),
  },
  {
    id: 'negative-active-trader-dashboard',
    movements: ['negative'],
    profiles: [InvestorProfile.ACTIVE_TRADER],
    build: ({ symbol, changePercentage24h }) => ({
      textTop: `Watching ${symbol} move ${formatPercentage(changePercentage24h as number)}`,
      textBottom: 'Checking the dashboard again anyway',
    }),
  },
  {
    id: 'negative-beginner-learning',
    movements: ['negative'],
    profiles: [InvestorProfile.BEGINNER],
    build: ({ symbol, changePercentage24h }) => ({
      textTop: `${symbol} moved ${formatPercentage(changePercentage24h as number)} today`,
      textBottom: 'Learning one dashboard refresh at a time',
    }),
  },
  {
    id: 'negative-enthusiast-watching',
    movements: ['negative'],
    profiles: [InvestorProfile.CRYPTO_ENTHUSIAST],
    build: ({ symbol, changePercentage24h }) => ({
      textTop: `${symbol} moved ${formatPercentage(changePercentage24h as number)} in 24 hours`,
      textBottom: 'Me watching market activity closely',
    }),
  },
  {
    id: 'neutral-general-watchlist',
    movements: ['neutral'],
    profiles: ALL_PROFILES,
    build: ({ symbol }) => ({
      textTop: `${symbol} is on my watchlist`,
      textBottom: 'Me checking the dashboard again',
    }),
  },
  {
    id: 'neutral-beginner-learning',
    movements: ['neutral'],
    profiles: [InvestorProfile.BEGINNER],
    build: ({ symbol }) => ({
      textTop: `${symbol} is on my watchlist`,
      textBottom: 'Learning one dashboard refresh at a time',
    }),
  },
  {
    id: 'neutral-long-term-patience',
    movements: ['neutral'],
    profiles: [InvestorProfile.LONG_TERM_HOLDER],
    build: ({ symbol }) => ({
      textTop: `${symbol} is on my watchlist`,
      textBottom: 'Long-term patience, short-term refreshing',
    }),
  },
  {
    id: 'neutral-active-trader-check',
    movements: ['neutral'],
    profiles: [InvestorProfile.ACTIVE_TRADER],
    build: ({ symbol }) => ({
      textTop: `${symbol} is on my watchlist`,
      textBottom: 'Opening the dashboard one more time',
    }),
  },
  {
    id: 'neutral-enthusiast-curious',
    movements: ['neutral'],
    profiles: [InvestorProfile.CRYPTO_ENTHUSIAST],
    build: ({ symbol }) => ({
      textTop: `${symbol} is on my watchlist`,
      textBottom: 'Just curious what happened today',
    }),
  },
];

export const MEME_CAPTION_VARIATION_IDS = MEME_CAPTION_VARIATIONS.map(
  (variation) => variation.id,
) as readonly string[];

export type MemeCaptionVariationId =
  (typeof MEME_CAPTION_VARIATION_IDS)[number];

const variationMap = new Map(
  MEME_CAPTION_VARIATIONS.map((variation) => [variation.id, variation]),
);

export function getEligibleCaptionVariationIds(
  movement: MovementCategory,
  investorProfile: string,
): string[] {
  return MEME_CAPTION_VARIATIONS.filter(
    (variation) =>
      variation.movements.includes(movement) &&
      variation.profiles.includes(investorProfile),
  ).map((variation) => variation.id);
}

export function selectMostVolatileMarketItem(
  items: MemeMarketItem[],
): MemeMarketItem {
  const itemsWithPercentage = items.filter(
    (item) => item.changePercentage24h !== null,
  );

  if (itemsWithPercentage.length === 0) {
    return items[0];
  }

  return itemsWithPercentage.reduce((selected, current) => {
    const selectedChange = selected.changePercentage24h as number;
    const currentChange = current.changePercentage24h as number;

    return Math.abs(currentChange) > Math.abs(selectedChange)
      ? current
      : selected;
  });
}

export function buildMemeCaptions(
  items: MemeMarketItem[],
  investorProfile: string,
  variationId: string,
): MemeCaptions {
  const selectedItem = selectMostVolatileMarketItem(items);
  const movement = getMovementCategory(selectedItem.changePercentage24h);
  const context: CaptionBuildContext = {
    symbol: selectedItem.symbol.toUpperCase(),
    name: selectedItem.name,
    changePercentage24h: selectedItem.changePercentage24h,
    investorProfile,
    movement,
  };

  const variation = variationMap.get(variationId);

  if (!variation) {
    throw new Error(`Unknown meme caption variation: ${variationId}`);
  }

  if (
    !variation.movements.includes(movement) ||
    !variation.profiles.includes(investorProfile)
  ) {
    throw new Error(
      `Caption variation ${variationId} is not eligible for the current context`,
    );
  }

  const captions = variation.build(context);

  if (
    containsRecommendationLanguage(`${captions.textTop} ${captions.textBottom}`)
  ) {
    throw new Error('Generated meme captions contain recommendation language');
  }

  return captions;
}
