import { NewsDataArticle } from '../interfaces/news-data.interfaces';

export interface SelectedCoinForRelevance {
  name: string;
  symbol: string;
  coingeckoId: string;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function normalizeForMatching(text: string): string {
  return normalizeWhitespace(text.toLowerCase().replace(/[^\w\s-]/g, ' '));
}

function containsCoinName(text: string, name: string): boolean {
  const normalizedText = normalizeForMatching(text);
  const normalizedName = normalizeForMatching(name);

  if (!normalizedName) {
    return false;
  }

  const nameParts = normalizedName.split(' ').filter(Boolean);

  if (nameParts.length === 1) {
    return new RegExp(`\\b${escapeRegex(nameParts[0])}\\b`, 'i').test(
      normalizedText,
    );
  }

  return normalizedText.includes(normalizedName);
}

function containsStandaloneSymbol(text: string, symbol: string): boolean {
  const upperSymbol = symbol.toUpperCase();

  if (!upperSymbol) {
    return false;
  }

  return new RegExp(`\\b${escapeRegex(upperSymbol)}\\b`, 'i').test(text);
}

export function isMeaningfulCoingeckoIdForMatching(
  coingeckoId: string,
): boolean {
  const normalizedId = normalizeForMatching(coingeckoId).replace(/\s+/g, '');

  if (normalizedId.length < 4) {
    return false;
  }

  return /^[a-z][a-z0-9-]*$/.test(normalizedId);
}

function containsCoingeckoId(text: string, coingeckoId: string): boolean {
  if (!isMeaningfulCoingeckoIdForMatching(coingeckoId)) {
    return false;
  }

  const normalizedText = normalizeForMatching(text);
  const normalizedId = normalizeForMatching(coingeckoId).replace(/\s+/g, '');

  return new RegExp(`\\b${escapeRegex(normalizedId)}\\b`, 'i').test(
    normalizedText,
  );
}

function fieldMentionsCoin(
  field: string,
  coin: SelectedCoinForRelevance,
): boolean {
  if (!field.trim()) {
    return false;
  }

  return (
    containsCoinName(field, coin.name) ||
    containsStandaloneSymbol(field, coin.symbol) ||
    containsCoingeckoId(field, coin.coingeckoId)
  );
}

function isRelevantForCoin(
  article: NewsDataArticle,
  coin: SelectedCoinForRelevance,
): boolean {
  const title = article.title ?? '';
  const description = article.description ?? '';

  return fieldMentionsCoin(title, coin) || fieldMentionsCoin(description, coin);
}

export function isArticleRelevantToSelectedCoins(
  article: NewsDataArticle,
  selectedCoins: SelectedCoinForRelevance[],
): boolean {
  if (selectedCoins.length === 0) {
    return false;
  }

  return selectedCoins.some((coin) => isRelevantForCoin(article, coin));
}

export function filterNewsArticlesByRelevance(
  articles: NewsDataArticle[],
  selectedCoins: SelectedCoinForRelevance[],
): NewsDataArticle[] {
  return articles.filter((article) =>
    isArticleRelevantToSelectedCoins(article, selectedCoins),
  );
}

export function toSelectedCoinsForRelevance(
  coins: Array<{ name: string; symbol: string; coingeckoId: string }>,
): SelectedCoinForRelevance[] {
  return coins.map((coin) => ({
    name: coin.name,
    symbol: coin.symbol.toUpperCase(),
    coingeckoId: coin.coingeckoId,
  }));
}
