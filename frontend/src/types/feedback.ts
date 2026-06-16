export type FeedbackContentType = 'MARKET' | 'NEWS' | 'INSIGHT' | 'MEME';

export type FeedbackType = 'UP' | 'DOWN';

export interface UpsertFeedbackInput {
  contentType: FeedbackContentType;
  contentId: string;
  feedbackType: FeedbackType;
}

export interface FeedbackRecord {
  contentType: FeedbackContentType;
  contentId: string;
  feedbackType: FeedbackType;
  updatedAt: string;
}

export interface FeedbackListResponse {
  items: FeedbackRecord[];
}
