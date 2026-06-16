import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import * as feedbackApi from '../api/feedback';
import { createDashboardResponse, mockDashboardResponse } from './dashboard.fixtures';
import { useDashboardFeedback } from './use-dashboard-feedback';

vi.mock('../api/feedback');

describe('useDashboardFeedback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not inherit a previous insight vote when the insight id changes', async () => {
    vi.mocked(feedbackApi.getFeedback).mockResolvedValue({
      items: [
        {
          contentType: 'INSIGHT',
          contentId: 'daily-insight:1',
          feedbackType: 'UP',
          updatedAt: '2026-06-16T10:00:00.000Z',
        },
      ],
    });

    const { result, rerender } = renderHook(
      ({ dashboard }) => useDashboardFeedback(dashboard),
      {
        initialProps: { dashboard: mockDashboardResponse },
      },
    );

    await waitFor(() => {
      expect(result.current.getVote('INSIGHT', 'daily-insight:1')).toBe('UP');
    });

    vi.mocked(feedbackApi.getFeedback).mockResolvedValue({ items: [] });

    rerender({
      dashboard: createDashboardResponse({
        insight: {
          status: 'available',
          data: {
            ...mockDashboardResponse.insight.data!,
            feedbackContentId: 'daily-insight:2',
          },
        },
      }),
    });

    await waitFor(() => {
      expect(feedbackApi.getFeedback).toHaveBeenLastCalledWith(
        expect.arrayContaining(['daily-insight:2']),
      );
      expect(result.current.getVote('INSIGHT', 'daily-insight:2')).toBeNull();
      expect(result.current.getVote('INSIGHT', 'daily-insight:1')).toBeNull();
    });
  });

  it('does not inherit a previous meme vote when the meme id changes', async () => {
    vi.mocked(feedbackApi.getFeedback).mockResolvedValue({
      items: [
        {
          contentType: 'MEME',
          contentId: 'daily-meme:1',
          feedbackType: 'DOWN',
          updatedAt: '2026-06-16T10:00:00.000Z',
        },
      ],
    });

    const { result, rerender } = renderHook(
      ({ dashboard }) => useDashboardFeedback(dashboard),
      {
        initialProps: { dashboard: mockDashboardResponse },
      },
    );

    await waitFor(() => {
      expect(result.current.getVote('MEME', 'daily-meme:1')).toBe('DOWN');
    });

    vi.mocked(feedbackApi.getFeedback).mockResolvedValue({ items: [] });

    rerender({
      dashboard: createDashboardResponse({
        meme: {
          status: 'available',
          data: {
            ...mockDashboardResponse.meme.data!,
            feedbackContentId: 'daily-meme:2',
          },
        },
      }),
    });

    await waitFor(() => {
      expect(result.current.getVote('MEME', 'daily-meme:2')).toBeNull();
      expect(result.current.getVote('MEME', 'daily-meme:1')).toBeNull();
    });
  });

  it('does not inherit another coin vote when market items change', async () => {
    vi.mocked(feedbackApi.getFeedback).mockResolvedValue({
      items: [
        {
          contentType: 'MARKET',
          contentId: 'coin:1',
          feedbackType: 'UP',
          updatedAt: '2026-06-16T10:00:00.000Z',
        },
      ],
    });

    const { result, rerender } = renderHook(
      ({ dashboard }) => useDashboardFeedback(dashboard),
      {
        initialProps: { dashboard: mockDashboardResponse },
      },
    );

    await waitFor(() => {
      expect(result.current.getVote('MARKET', 'coin:1')).toBe('UP');
    });

    vi.mocked(feedbackApi.getFeedback).mockResolvedValue({ items: [] });

    rerender({
      dashboard: createDashboardResponse({
        market: {
          status: 'available',
          isStale: false,
          items: [
            {
              ...mockDashboardResponse.market.items![1],
            },
          ],
        },
      }),
    });

    await waitFor(() => {
      expect(result.current.getVote('MARKET', 'coin:2')).toBeNull();
      expect(result.current.getVote('MARKET', 'coin:1')).toBeNull();
    });
  });

  it('restores a saved vote for an unchanged content id', async () => {
    vi.mocked(feedbackApi.getFeedback).mockResolvedValue({
      items: [
        {
          contentType: 'NEWS',
          contentId: 'news-1',
          feedbackType: 'DOWN',
          updatedAt: '2026-06-16T10:00:00.000Z',
        },
      ],
    });

    const { result } = renderHook(() =>
      useDashboardFeedback(mockDashboardResponse),
    );

    await waitFor(() => {
      expect(result.current.getVote('NEWS', 'news-1')).toBe('DOWN');
    });
  });

  it('replaces the vote map on refresh instead of merging stale entries', async () => {
    vi.mocked(feedbackApi.getFeedback)
      .mockResolvedValueOnce({
        items: [
          {
            contentType: 'MARKET',
            contentId: 'coin:1',
            feedbackType: 'UP',
            updatedAt: '2026-06-16T10:00:00.000Z',
          },
          {
            contentType: 'MARKET',
            contentId: 'coin:2',
            feedbackType: 'DOWN',
            updatedAt: '2026-06-16T10:00:00.000Z',
          },
        ],
      })
      .mockResolvedValueOnce({
        items: [
          {
            contentType: 'MARKET',
            contentId: 'coin:2',
            feedbackType: 'UP',
            updatedAt: '2026-06-16T10:05:00.000Z',
          },
        ],
      });

    const { result, rerender } = renderHook(
      ({ dashboard }) => useDashboardFeedback(dashboard),
      {
        initialProps: { dashboard: mockDashboardResponse },
      },
    );

    await waitFor(() => {
      expect(result.current.getVote('MARKET', 'coin:1')).toBe('UP');
      expect(result.current.getVote('MARKET', 'coin:2')).toBe('DOWN');
    });

    rerender({
      dashboard: createDashboardResponse({
        market: {
          status: 'available',
          isStale: false,
          items: [mockDashboardResponse.market.items![1]],
        },
      }),
    });

    await waitFor(() => {
      expect(result.current.getVote('MARKET', 'coin:1')).toBeNull();
      expect(result.current.getVote('MARKET', 'coin:2')).toBe('UP');
    });
  });

  it('drops hidden section votes locally without deleting backend feedback', async () => {
    vi.mocked(feedbackApi.getFeedback).mockResolvedValue({ items: [] });

    const { result, rerender } = renderHook(
      ({ dashboard }) => useDashboardFeedback(dashboard),
      {
        initialProps: { dashboard: mockDashboardResponse },
      },
    );

    await waitFor(() => {
      expect(feedbackApi.getFeedback).toHaveBeenCalled();
    });

    rerender({
      dashboard: createDashboardResponse({
        meme: { status: 'disabled' },
      }),
    });

    await waitFor(() => {
      expect(result.current.getVote('MEME', 'daily-meme:1')).toBeNull();
    });

    expect(feedbackApi.upsertFeedback).not.toHaveBeenCalled();
  });
});
