import { NewsDataArticle } from '../interfaces/news-data.interfaces';
import {
  filterNewsArticlesByRelevance,
  isArticleRelevantToSelectedCoins,
  isMeaningfulCoingeckoIdForMatching,
  SelectedCoinForRelevance,
} from './news-relevance-filter';

const selectedCoins: SelectedCoinForRelevance[] = [
  { name: 'Bitcoin', symbol: 'BTC', coingeckoId: 'bitcoin' },
  { name: 'Ethereum', symbol: 'ETH', coingeckoId: 'ethereum' },
  { name: 'Dogecoin', symbol: 'DOGE', coingeckoId: 'dogecoin' },
  { name: 'XRP', symbol: 'XRP', coingeckoId: 'ripple' },
];

function createArticle(
  overrides: Partial<NewsDataArticle> & Pick<NewsDataArticle, 'article_id'>,
): NewsDataArticle {
  return {
    link: `https://example.com/${overrides.article_id}`,
    title: 'Untitled',
    description: null,
    keywords: null,
    creator: null,
    coin: null,
    language: null,
    pubDate: null,
    image_url: null,
    source_id: null,
    source_name: null,
    source_url: null,
    ...overrides,
  };
}

describe('news relevance filter', () => {
  it('retains an article when the title contains the selected coin name', () => {
    const article = createArticle({
      article_id: 'btc-title',
      title: 'Bitcoin falls after market volatility',
      coin: [],
    });

    expect(isArticleRelevantToSelectedCoins(article, selectedCoins)).toBe(true);
  });

  it('retains an article when the title contains a standalone selected symbol', () => {
    const article = createArticle({
      article_id: 'btc-symbol-title',
      title: 'BTC rebounds after sell-off',
      description: null,
      coin: [],
    });

    expect(isArticleRelevantToSelectedCoins(article, selectedCoins)).toBe(true);
  });

  it('retains an article when the description contains the selected coin name', () => {
    const article = createArticle({
      article_id: 'btc-description',
      title: 'Market recap',
      description: 'Bitcoin trading volume increased during the session.',
      coin: [],
    });

    expect(isArticleRelevantToSelectedCoins(article, selectedCoins)).toBe(true);
  });

  it('retains an article when the description contains a standalone selected symbol', () => {
    const article = createArticle({
      article_id: 'eth-description',
      title: 'Network update',
      description: 'ETH staking rewards increased this week.',
      coin: [],
    });

    expect(isArticleRelevantToSelectedCoins(article, selectedCoins)).toBe(true);
  });

  it('removes an article when relatedCoins matches but title and description do not mention the coin', () => {
    const article = createArticle({
      article_id: 'gold-price',
      title: 'Gold prices surge on geopolitical tension',
      description: 'Precious metals rallied while equities fell.',
      coin: ['BTC'],
    });

    expect(isArticleRelevantToSelectedCoins(article, selectedCoins)).toBe(
      false,
    );
  });

  it('removes an article that mentions only unselected coins', () => {
    const article = createArticle({
      article_id: 'sol-only',
      title: 'Solana ecosystem growth accelerates',
      description: 'SOL network activity reached a new high.',
      coin: ['SOL'],
    });

    expect(isArticleRelevantToSelectedCoins(article, selectedCoins)).toBe(
      false,
    );
  });

  it('retains a multi-coin article when one selected coin appears in the preview text', () => {
    const article = createArticle({
      article_id: 'multi-coin',
      title: 'Solana and Cardano lead altcoin gains',
      description: 'Bitcoin also moved higher during the session.',
      coin: ['SOL', 'ADA', 'BTC'],
    });

    expect(isArticleRelevantToSelectedCoins(article, selectedCoins)).toBe(true);
  });

  it('handles missing description safely', () => {
    const article = createArticle({
      article_id: 'btc-title-only',
      title: 'BTC rebounds after sell-off',
      description: null,
      coin: ['BTC'],
    });

    expect(isArticleRelevantToSelectedCoins(article, selectedCoins)).toBe(true);
  });

  it('does not match short symbols inside unrelated words', () => {
    const article = createArticle({
      article_id: 'method',
      title: 'A new METHOD for portfolio allocation',
      description: 'Investors review allocation frameworks.',
      coin: ['ETH'],
    });

    expect(isArticleRelevantToSelectedCoins(article, selectedCoins)).toBe(
      false,
    );
  });

  it('matches coin names case-insensitively', () => {
    const article = createArticle({
      article_id: 'btc-case',
      title: 'bitcoin ETF outflows continue',
      description: null,
      coin: [],
    });

    expect(isArticleRelevantToSelectedCoins(article, selectedCoins)).toBe(true);
  });

  it('matches meaningful coingecko ids in preview text', () => {
    const article = createArticle({
      article_id: 'doge-id',
      title: 'Dogecoin community update',
      description: 'Developers discussed dogecoin network upgrades.',
      coin: [],
    });

    expect(isArticleRelevantToSelectedCoins(article, selectedCoins)).toBe(true);
    expect(isMeaningfulCoingeckoIdForMatching('dogecoin')).toBe(true);
  });

  it('filters a list of articles by selected coins', () => {
    const articles = [
      createArticle({
        article_id: 'relevant-btc',
        title: 'Bitcoin market update',
        coin: ['BTC'],
      }),
      createArticle({
        article_id: 'irrelevant',
        title: 'Gold prices surge',
        description: 'Precious metals rallied.',
        coin: ['BTC'],
      }),
    ];

    expect(filterNewsArticlesByRelevance(articles, selectedCoins)).toHaveLength(
      1,
    );
  });
});
