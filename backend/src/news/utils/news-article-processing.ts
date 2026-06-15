import { NewsDataArticle } from '../interfaces/news-data.interfaces';
import { NewsItemDto } from '../dto/news-response.dto';
import { toNewsItemDto } from '../mappers/news-response.mapper';

function normalizeUrl(url: string): string {
  return url.trim().toLowerCase();
}

export function deduplicateNewsArticles(
  articles: NewsDataArticle[],
): NewsDataArticle[] {
  const seenArticleIds = new Set<string>();
  const seenUrls = new Set<string>();
  const deduplicated: NewsDataArticle[] = [];

  for (const article of articles) {
    if (seenArticleIds.has(article.article_id)) {
      continue;
    }

    const normalizedUrl = normalizeUrl(article.link);

    if (seenUrls.has(normalizedUrl)) {
      continue;
    }

    seenArticleIds.add(article.article_id);
    seenUrls.add(normalizedUrl);
    deduplicated.push(article);
  }

  return deduplicated;
}

export function sortNewsArticlesByPublishedAt(
  articles: NewsDataArticle[],
): NewsDataArticle[] {
  return [...articles].sort((left, right) => {
    const leftDate = left.pubDate
      ? new Date(left.pubDate.replace(' ', 'T'))
      : null;
    const rightDate = right.pubDate
      ? new Date(right.pubDate.replace(' ', 'T'))
      : null;

    const leftTime =
      leftDate && !Number.isNaN(leftDate.getTime()) ? leftDate.getTime() : null;
    const rightTime =
      rightDate && !Number.isNaN(rightDate.getTime())
        ? rightDate.getTime()
        : null;

    if (leftTime === null && rightTime === null) {
      return left.article_id.localeCompare(right.article_id);
    }

    if (leftTime === null) {
      return 1;
    }

    if (rightTime === null) {
      return -1;
    }

    if (rightTime !== leftTime) {
      return rightTime - leftTime;
    }

    return left.article_id.localeCompare(right.article_id);
  });
}

export function mapNewsArticles(articles: NewsDataArticle[]): NewsItemDto[] {
  return sortNewsArticlesByPublishedAt(deduplicateNewsArticles(articles)).map(
    toNewsItemDto,
  );
}
