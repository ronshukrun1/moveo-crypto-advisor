import {
  buildInsightFeedbackContentId,
  buildMarketFeedbackContentId,
  buildMemeFeedbackContentId,
  buildNewsFeedbackContentId,
  parseInsightFeedbackContentId,
  parseMarketFeedbackContentId,
  parseMemeFeedbackContentId,
} from './feedback-content-id.utils';

describe('feedback content id utils', () => {
  it('builds stable market, insight, meme, and news identifiers', () => {
    expect(buildMarketFeedbackContentId(1)).toBe('coin:1');
    expect(buildInsightFeedbackContentId(123)).toBe('daily-insight:123');
    expect(buildMemeFeedbackContentId(456)).toBe('daily-meme:456');
    expect(buildNewsFeedbackContentId('article-id')).toBe('article-id');
  });

  it('parses market, insight, and meme identifiers', () => {
    expect(parseMarketFeedbackContentId('coin:1')).toBe(1);
    expect(parseInsightFeedbackContentId('daily-insight:123')).toBe(123);
    expect(parseMemeFeedbackContentId('daily-meme:456')).toBe(456);
    expect(parseMarketFeedbackContentId('invalid')).toBeNull();
  });
});
