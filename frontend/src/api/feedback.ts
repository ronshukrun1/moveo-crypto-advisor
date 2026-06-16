import type {
  FeedbackListResponse,
  FeedbackRecord,
  UpsertFeedbackInput,
} from '../types/feedback';
import { apiClient } from './api-client';
import { endpoints } from './endpoints';

export async function upsertFeedback(
  input: UpsertFeedbackInput,
): Promise<FeedbackRecord> {
  const response = await apiClient.put<FeedbackRecord>(endpoints.feedback, input);
  return response.data;
}

export async function getFeedback(contentIds: string[]): Promise<FeedbackListResponse> {
  if (contentIds.length === 0) {
    return { items: [] };
  }

  const response = await apiClient.get<FeedbackListResponse>(endpoints.feedback, {
    params: { contentIds: contentIds.join(',') },
  });
  return response.data;
}
