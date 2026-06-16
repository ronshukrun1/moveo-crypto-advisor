import { NewsDataArticle } from '../interfaces/news-data.interfaces';
import { buildNewsFeedbackContentId } from '../../feedback/utils/feedback-content-id.utils';
import { NewsItemDto } from '../dto/news-response.dto.js';

function parsePublishedAt(pubDate: string | null): string | null {
  if (!pubDate) {
    return null;
  }

  const normalized = pubDate.includes('T')
    ? pubDate
    : `${pubDate.replace(' ', 'T')}Z`;

  const parsed = new Date(normalized);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

export function toNewsItemDto(article: NewsDataArticle): NewsItemDto {
  return {
    id: article.article_id,
    title: article.title,
    description: article.description,
    url: article.link,
    imageUrl: article.image_url,
    sourceName: article.source_name,
    sourceUrl: article.source_url,
    creator: article.creator ?? null,
    relatedCoins: article.coin?.map((symbol) => symbol.toUpperCase()) ?? null,
    publishedAt: parsePublishedAt(article.pubDate),
    feedbackContentId: buildNewsFeedbackContentId(article.article_id),
  };
}
