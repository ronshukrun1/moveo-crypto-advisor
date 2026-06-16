export interface MemeMarketItem {
  symbol: string;
  name: string;
  changePercentage24h: number | null;
}

export interface MemeCaptions {
  textTop: string;
  textBottom: string;
}

const RECOMMENDATION_PATTERNS = [
  /\bbuy\b/i,
  /\bsell\b/i,
  /\bhold\b/i,
  /\binvestment opportunity\b/i,
  /\bguaranteed return\b/i,
];

const DEFAULT_TEXT_BOTTOM = 'Me checking the dashboard again';

function formatPercentage(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  const normalized = Object.is(rounded, -0) ? 0 : rounded;
  return `${normalized}%`;
}

function containsRecommendationLanguage(text: string): boolean {
  return RECOMMENDATION_PATTERNS.some((pattern) => pattern.test(text));
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

export function buildMemeCaptions(items: MemeMarketItem[]): MemeCaptions {
  const selectedItem = selectMostVolatileMarketItem(items);
  const symbol = selectedItem.symbol.toUpperCase();

  const textTop =
    selectedItem.changePercentage24h === null
      ? `${symbol} is on my watchlist`
      : `${symbol} moved ${formatPercentage(selectedItem.changePercentage24h)} in 24 hours`;

  const captions = {
    textTop,
    textBottom: DEFAULT_TEXT_BOTTOM,
  };

  if (
    containsRecommendationLanguage(`${captions.textTop} ${captions.textBottom}`)
  ) {
    throw new Error('Generated meme captions contain recommendation language');
  }

  return captions;
}
