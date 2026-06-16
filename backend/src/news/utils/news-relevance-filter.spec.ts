import { NewsDataArticle } from '../interfaces/news-data.interfaces';
import {
  filterNewsArticlesByRelevance,
  isArticleRelevantToSelectedCoins,
  SelectedCoinForRelevance,
} from './news-relevance-filter';

const selectedCoins: SelectedCoinForRelevance[] = [
  { name: 'Bitcoin', symbol: 'BTC', coingeckoId: 'bitcoin' },
  { name: 'Ethereum', symbol: 'ETH', coingeckoId: 'ethereum' },
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
  it('retains an article when relatedCoins contains BTC and title contains Bitcoin', () => {
    const article = createArticle({
      article_id: 'btc-etf',
      title: 'Bitcoin ETF outflows continue',
      coin: ['BTC'],
    });

    expect(isArticleRelevantToSelectedCoins(article, selectedCoins)).toBe(true);
  });

  it('retains an article when description contains Ethereum', () => {
    const article = createArticle({
      article_id: 'eth-staking',
      title: 'Network update',
      description: 'Ethereum staking rewards increased this week',
      coin: ['ETH'],
    });

    expect(isArticleRelevantToSelectedCoins(article, selectedCoins)).toBe(true);
  });

  it('retains an article when title contains standalone ETH', () => {
    const article = createArticle({
      article_id: 'eth-title',
      title: 'ETH staking rewards rise',
      description: null,
      coin: [],
    });

    expect(isArticleRelevantToSelectedCoins(article, selectedCoins)).toBe(true);
  });

  it('removes an article when relatedCoins contains BTC but title and description are unrelated', () => {
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

  it('retains a multi-coin article when one selected coin matches', () => {
    const article = createArticle({
      article_id: 'multi-coin',
      title: 'Bitcoin and Solana market recap',
      description: 'Bitcoin led gains while Solana followed.',
      coin: ['BTC', 'SOL'],
    });

    expect(isArticleRelevantToSelectedCoins(article, selectedCoins)).toBe(true);
  });

  it('removes an article that matches only an unselected coin', () => {
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

  it('handles missing description safely', () => {
    const article = createArticle({
      article_id: 'btc-title-only',
      title: 'BTC rebounds after sell-off',
      description: null,
      coin: ['BTC'],
    });

    expect(isArticleRelevantToSelectedCoins(article, selectedCoins)).toBe(true);
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
        coin: ['BTC'],
      }),
    ];

    expect(filterNewsArticlesByRelevance(articles, selectedCoins)).toHaveLength(
      1,
    );
  });
});
