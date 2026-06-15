import { BadGatewayException } from '@nestjs/common';
import {
  NewsDataArticle,
  NewsDataResponse,
} from '../interfaces/news-data.interfaces';

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === 'string')
  );
}

function isNullableStringArray(value: unknown): value is string[] | null {
  return value === null || isStringArray(value);
}

export function isNewsDataArticle(value: unknown): value is NewsDataArticle {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const article = value as Record<string, unknown>;

  return (
    typeof article.article_id === 'string' &&
    article.article_id.length > 0 &&
    typeof article.link === 'string' &&
    article.link.length > 0 &&
    typeof article.title === 'string' &&
    article.title.length > 0 &&
    (typeof article.description === 'string' || article.description === null) &&
    isNullableStringArray(article.keywords) &&
    isNullableStringArray(article.creator) &&
    isNullableStringArray(article.coin) &&
    (typeof article.language === 'string' || article.language === null) &&
    (typeof article.pubDate === 'string' || article.pubDate === null) &&
    (typeof article.image_url === 'string' || article.image_url === null) &&
    (typeof article.source_id === 'string' || article.source_id === null) &&
    (typeof article.source_name === 'string' || article.source_name === null) &&
    (typeof article.source_url === 'string' || article.source_url === null)
  );
}

export function parseNewsDataResponse(data: unknown): NewsDataResponse {
  if (!data || typeof data !== 'object') {
    throw new BadGatewayException('Unable to retrieve news');
  }

  const response = data as Record<string, unknown>;

  if (response.status !== 'success') {
    throw new BadGatewayException('Unable to retrieve news');
  }

  if (!Array.isArray(response.results)) {
    throw new BadGatewayException('Unable to retrieve news');
  }

  const results = response.results.filter(isNewsDataArticle);
  const nextPage =
    typeof response.nextPage === 'string' && response.nextPage.length > 0
      ? response.nextPage
      : null;

  return {
    status: 'success',
    totalResults:
      typeof response.totalResults === 'number' ? response.totalResults : null,
    results,
    nextPage,
  };
}
