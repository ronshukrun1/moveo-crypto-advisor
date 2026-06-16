import type { FeedbackContentType } from '../types/feedback';
import type { DashboardResponse } from './dashboard.types';

export interface FeedbackTarget {
  contentType: FeedbackContentType;
  contentId: string;
}

export function buildFeedbackKey(
  contentType: FeedbackContentType,
  contentId: string,
): string {
  return `${contentType}:${contentId}`;
}

export function collectFeedbackTargets(
  dashboard: DashboardResponse,
): FeedbackTarget[] {
  const targets: FeedbackTarget[] = [];

  dashboard.market.items?.forEach((item) => {
    if (item.feedbackContentId) {
      targets.push({ contentType: 'MARKET', contentId: item.feedbackContentId });
    }
  });
  dashboard.news.items?.forEach((item) => {
    if (item.feedbackContentId) {
      targets.push({ contentType: 'NEWS', contentId: item.feedbackContentId });
    }
  });
  if (dashboard.insight.data?.feedbackContentId) {
    targets.push({
      contentType: 'INSIGHT',
      contentId: dashboard.insight.data.feedbackContentId,
    });
  }
  if (dashboard.meme.data?.feedbackContentId) {
    targets.push({
      contentType: 'MEME',
      contentId: dashboard.meme.data.feedbackContentId,
    });
  }

  return targets;
}

export function buildFeedbackTargetsKey(targets: FeedbackTarget[]): string {
  return targets
    .map((target) => buildFeedbackKey(target.contentType, target.contentId))
    .sort()
    .join('|');
}
