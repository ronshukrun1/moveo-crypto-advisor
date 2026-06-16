export function buildMarketFeedbackContentId(coinId: number): string {
  return `coin:${coinId}`;
}

export function buildInsightFeedbackContentId(insightId: number): string {
  return `daily-insight:${insightId}`;
}

export function buildMemeFeedbackContentId(memeId: number): string {
  return `daily-meme:${memeId}`;
}

export function buildNewsFeedbackContentId(articleId: string): string {
  return articleId;
}

export function parseMarketFeedbackContentId(contentId: string): number | null {
  const match = /^coin:(\d+)$/.exec(contentId);
  if (!match) {
    return null;
  }

  return Number.parseInt(match[1], 10);
}

export function parseInsightFeedbackContentId(
  contentId: string,
): number | null {
  const match = /^daily-insight:(\d+)$/.exec(contentId);
  if (!match) {
    return null;
  }

  return Number.parseInt(match[1], 10);
}

export function parseMemeFeedbackContentId(contentId: string): number | null {
  const match = /^daily-meme:(\d+)$/.exec(contentId);
  if (!match) {
    return null;
  }

  return Number.parseInt(match[1], 10);
}
