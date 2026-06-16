import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DashboardPage } from '../pages/DashboardPage';
import { renderWithProviders } from '../test/test-utils';
import * as authApi from '../api/auth';
import * as dashboardApi from '../api/dashboard';
import * as feedbackApi from '../api/feedback';
import { setStoredToken, clearStoredToken } from '../auth/auth-storage';
import { createDashboardResponse, mockDashboardResponse } from './dashboard.fixtures';

vi.mock('../api/auth');
vi.mock('../api/dashboard');
vi.mock('../api/feedback');

const completeUser = {
  id: 2,
  name: 'Alex',
  email: 'alex@example.com',
  onboardingCompleted: true,
};

describe('dashboard feedback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearStoredToken();
    localStorage.clear();
    setStoredToken('token-complete');
    vi.mocked(authApi.getCurrentUser).mockResolvedValue(completeUser);
    vi.mocked(dashboardApi.getDashboard).mockResolvedValue(mockDashboardResponse);
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
    vi.mocked(feedbackApi.upsertFeedback).mockResolvedValue({
      contentType: 'NEWS',
      contentId: 'news-1',
      feedbackType: 'DOWN',
      updatedAt: '2026-06-16T10:01:00.000Z',
    });
  });

  it('renders voting controls for all dashboard sections', async () => {
    renderWithProviders(<DashboardPage />, {
      routerProps: { initialEntries: ['/dashboard'] },
    });

    await screen.findByRole('heading', { name: 'Market News' });
    expect(screen.getAllByLabelText('Mark as helpful')).toHaveLength(5);
    expect(screen.getAllByLabelText('Mark as not helpful')).toHaveLength(5);
  });

  it('loads existing votes in batch and shows selected state', async () => {
    renderWithProviders(<DashboardPage />, {
      routerProps: { initialEntries: ['/dashboard'] },
    });

    await screen.findByRole('heading', { name: 'AI Insight of the Day' });

    await waitFor(() => {
      expect(feedbackApi.getFeedback).toHaveBeenCalledWith([
        'coin:1',
        'coin:2',
        'news-1',
        'daily-insight:1',
        'daily-meme:1',
      ]);
    });

    await waitFor(() => {
      const insightSection = screen
        .getByRole('heading', { name: 'AI Insight of the Day' })
        .closest('[class*="MuiCard"]');
      expect(insightSection).not.toBeNull();
      const helpfulButton = insightSection!.querySelector(
        'button[aria-label="Mark as helpful"]',
      );
      expect(helpfulButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  it('does not show a previous insight vote after dashboard refresh with a new insight id', async () => {
    const user = userEvent.setup();
    vi.mocked(feedbackApi.getFeedback)
      .mockResolvedValueOnce({
        items: [
          {
            contentType: 'INSIGHT',
            contentId: 'daily-insight:1',
            feedbackType: 'UP',
            updatedAt: '2026-06-16T10:00:00.000Z',
          },
        ],
      })
      .mockResolvedValueOnce({ items: [] });

    vi.mocked(dashboardApi.getDashboard)
      .mockResolvedValueOnce(mockDashboardResponse)
      .mockResolvedValueOnce(
        createDashboardResponse({
          insight: {
            status: 'available',
            data: {
              ...mockDashboardResponse.insight.data!,
              feedbackContentId: 'daily-insight:99',
            },
          },
        }),
      );

    renderWithProviders(<DashboardPage />, {
      routerProps: { initialEntries: ['/dashboard'] },
    });

    await screen.findByRole('heading', { name: 'AI Insight of the Day' });

    await waitFor(() => {
      const insightSection = screen
        .getByRole('heading', { name: 'AI Insight of the Day' })
        .closest('[class*="MuiCard"]');
      expect(
        insightSection!.querySelector('button[aria-label="Mark as helpful"]'),
      ).toHaveAttribute('aria-pressed', 'true');
    });

    await user.click(screen.getByRole('button', { name: 'Refresh dashboard' }));

    await waitFor(() => {
      expect(dashboardApi.getDashboard).toHaveBeenCalledTimes(2);
    });

    await waitFor(() => {
      const insightSection = screen
        .getByRole('heading', { name: 'AI Insight of the Day' })
        .closest('[class*="MuiCard"]');
      expect(
        insightSection!.querySelector('button[aria-label="Mark as helpful"]'),
      ).toHaveAttribute('aria-pressed', 'false');
    });
  });

  it('sends the correct payload when voting and does not refetch the dashboard', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DashboardPage />, {
      routerProps: { initialEntries: ['/dashboard'] },
    });

    await screen.findByRole('heading', { name: 'Market News' });
    const notHelpfulButtons = screen.getAllByLabelText('Mark as not helpful');
    await user.click(notHelpfulButtons[0]);

    await waitFor(() => {
      expect(feedbackApi.upsertFeedback).toHaveBeenCalledWith({
        contentType: 'NEWS',
        contentId: 'news-1',
        feedbackType: 'DOWN',
      });
    });
    expect(dashboardApi.getDashboard).toHaveBeenCalledTimes(1);
  });

  it('keeps the dashboard visible when feedback loading fails', async () => {
    vi.mocked(feedbackApi.getFeedback).mockRejectedValue(new Error('network'));

    renderWithProviders(<DashboardPage />, {
      routerProps: { initialEntries: ['/dashboard'] },
    });

    expect(await screen.findByRole('heading', { name: 'Market News' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Coin Prices' })).toBeInTheDocument();
  });

  it('shows a safe inline message when saving feedback fails', async () => {
    const user = userEvent.setup();
    vi.mocked(feedbackApi.upsertFeedback).mockRejectedValue(new Error('network'));

    renderWithProviders(<DashboardPage />, {
      routerProps: { initialEntries: ['/dashboard'] },
    });

    await screen.findByRole('heading', { name: 'Market News' });
    await user.click(screen.getAllByLabelText('Mark as helpful')[0]);

    expect(
      await screen.findByText('Unable to save your feedback right now.'),
    ).toBeInTheDocument();
  });
});
