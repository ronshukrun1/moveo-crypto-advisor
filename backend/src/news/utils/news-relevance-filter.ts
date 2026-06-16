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
  return normalizeWhitespace(text.toLowerCase().replace(/[^\w\s]/g, ' '));
}

function getRelatedCoinSymbols(article: NewsDataArticle): string[] {
  return (article.coin ?? []).map((symbol) => symbol.toUpperCase());
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

function containsCoingeckoId(text: string, coingeckoId: string): boolean {
  const normalizedText = normalizeForMatching(text);
  const normalizedId = normalizeForMatching(coingeckoId);

  if (!normalizedId) {
    return false;
  }

  return new RegExp(`\\b${escapeRegex(normalizedId)}\\b`, 'i').test(
    normalizedText,
  );
}

function textMentionsCoin(
  title: string,
  description: string,
  coin: SelectedCoinForRelevance,
): boolean {
  const combinedText = normalizeWhitespace(`${title} ${description}`.trim());

  if (!combinedText) {
    return false;
  }

  return (
    containsCoinName(combinedText, coin.name) ||
    containsStandaloneSymbol(combinedText, coin.symbol) ||
    containsCoingeckoId(combinedText, coin.coingeckoId)
  );
}

function hasStrongTitleMatch(
  title: string,
  coin: SelectedCoinForRelevance,
): boolean {
  if (!title.trim()) {
    return false;
  }

  return (
    containsCoinName(title, coin.name) ||
    containsStandaloneSymbol(title, coin.symbol) ||
    containsCoingeckoId(title, coin.coingeckoId)
  );
}

function isRelevantForCoin(
  article: NewsDataArticle,
  coin: SelectedCoinForRelevance,
): boolean {
  const relatedCoins = getRelatedCoinSymbols(article);
  const title = article.title ?? '';
  const description = article.description ?? '';
  const symbol = coin.symbol.toUpperCase();
  const hasRelatedCoin = relatedCoins.includes(symbol);
  const mentionsInContent = textMentionsCoin(title, description, coin);

  if (hasRelatedCoin && mentionsInContent) {
    return true;
  }

  return hasStrongTitleMatch(title, coin);
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
