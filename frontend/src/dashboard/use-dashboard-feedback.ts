import { useCallback, useEffect, useMemo, useState } from 'react';
import { getFeedback, upsertFeedback } from '../api/feedback';
import { normalizeApiError } from '../api/api-error';
import type {
  FeedbackContentType,
  FeedbackType,
} from '../types/feedback';
import type { DashboardResponse } from './dashboard.types';
import {
  buildFeedbackKey,
  buildFeedbackTargetsKey,
  collectFeedbackTargets,
} from './feedback-key.utils';

export interface DashboardFeedbackController {
  getVote: (
    contentType: FeedbackContentType,
    contentId: string,
  ) => FeedbackType | null;
  isSaving: (contentType: FeedbackContentType, contentId: string) => boolean;
  getError: (contentType: FeedbackContentType, contentId: string) => string | null;
  vote: (
    contentType: FeedbackContentType,
    contentId: string,
    feedbackType: FeedbackType,
  ) => Promise<void>;
}

export function useDashboardFeedback(
  dashboard: DashboardResponse | null,
): DashboardFeedbackController {
  const [votesByKey, setVotesByKey] = useState<Record<string, FeedbackType>>({});
  const [savingKeys, setSavingKeys] = useState<Set<string>>(new Set());
  const [errorsByKey, setErrorsByKey] = useState<Record<string, string>>({});

  const feedbackTargets = useMemo(
    () => (dashboard ? collectFeedbackTargets(dashboard) : []),
    [dashboard],
  );
  const feedbackTargetsKey = useMemo(
    () => buildFeedbackTargetsKey(feedbackTargets),
    [feedbackTargets],
  );

  const targetKeySet = useMemo(
    () =>
      new Set(
        feedbackTargets.map((target) =>
          buildFeedbackKey(target.contentType, target.contentId),
        ),
      ),
    [feedbackTargets],
  );

  useEffect(() => {
    if (!dashboard || feedbackTargets.length === 0) {
      return;
    }

    let cancelled = false;
    const targetKeys = new Set(
      feedbackTargets.map((target) =>
        buildFeedbackKey(target.contentType, target.contentId),
      ),
    );
    const contentIds = feedbackTargets.map((target) => target.contentId);

    void getFeedback(contentIds)
      .then((response) => {
        if (cancelled) {
          return;
        }

        const nextVotes: Record<string, FeedbackType> = {};

        for (const item of response.items) {
          const key = buildFeedbackKey(item.contentType, item.contentId);
          if (targetKeys.has(key)) {
            nextVotes[key] = item.feedbackType;
          }
        }

        setVotesByKey(nextVotes);
        setErrorsByKey((current) => {
          const next: Record<string, string> = {};
          for (const [key, message] of Object.entries(current)) {
            if (targetKeys.has(key)) {
              next[key] = message;
            }
          }
          return next;
        });
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setVotesByKey({});
      });

    return () => {
      cancelled = true;
    };
  }, [dashboard, feedbackTargets, feedbackTargetsKey]);

  const vote = useCallback(
    async (
      contentType: FeedbackContentType,
      contentId: string,
      feedbackType: FeedbackType,
    ) => {
      const key = buildFeedbackKey(contentType, contentId);

      setSavingKeys((current) => new Set(current).add(key));
      setErrorsByKey((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });

      try {
        const saved = await upsertFeedback({
          contentType,
          contentId,
          feedbackType,
        });
        const savedKey = buildFeedbackKey(saved.contentType, saved.contentId);
        setVotesByKey((current) => ({
          ...current,
          [savedKey]: saved.feedbackType,
        }));
      } catch (error) {
        const apiError = normalizeApiError(error);
        setErrorsByKey((current) => ({
          ...current,
          [key]: 'Unable to save your feedback right now.',
        }));

        if (apiError.statusCode === 401) {
          return;
        }
      } finally {
        setSavingKeys((current) => {
          const next = new Set(current);
          next.delete(key);
          return next;
        });
      }
    },
    [],
  );

  const getVote = useCallback(
    (contentType: FeedbackContentType, contentId: string) => {
      const key = buildFeedbackKey(contentType, contentId);
      if (!targetKeySet.has(key)) {
        return null;
      }

      return votesByKey[key] ?? null;
    },
    [targetKeySet, votesByKey],
  );

  const isSaving = useCallback(
    (contentType: FeedbackContentType, contentId: string) => {
      const key = buildFeedbackKey(contentType, contentId);
      if (!targetKeySet.has(key)) {
        return false;
      }

      return savingKeys.has(key);
    },
    [targetKeySet, savingKeys],
  );

  const getError = useCallback(
    (contentType: FeedbackContentType, contentId: string) => {
      const key = buildFeedbackKey(contentType, contentId);
      if (!targetKeySet.has(key)) {
        return null;
      }

      return errorsByKey[key] ?? null;
    },
    [targetKeySet, errorsByKey],
  );

  return {
    getVote,
    isSaving,
    getError,
    vote,
  };
}
