import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router-dom';
import { DashboardPage } from '../pages/DashboardPage';
import { OnboardingPage } from '../pages/OnboardingPage';
import { ProtectedRoute } from '../auth/ProtectedRoute';
import { OnboardingRequiredRoute } from '../auth/OnboardingRequiredRoute';
import { OnboardingOnlyRoute } from '../auth/OnboardingOnlyRoute';
import { renderWithProviders } from '../test/test-utils';
import * as authApi from '../api/auth';
import * as coinsApi from '../api/coins';
import * as dashboardApi from '../api/dashboard';
import { ApiError } from '../api/api-error';
import { setStoredToken, clearStoredToken } from '../auth/auth-storage';
import {
  createDashboardResponse,
  mockDashboardResponse,
} from './dashboard.fixtures';

vi.mock('../api/auth');
vi.mock('../api/coins');
vi.mock('../api/dashboard');

const completeUser = {
  id: 2,
  name: 'Alex',
  email: 'alex@example.com',
  onboardingCompleted: true,
};

function DashboardRoutes() {
  return (
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route element={<OnboardingOnlyRoute />}>
          <Route path="/onboarding" element={<OnboardingPage />} />
        </Route>
        <Route element={<OnboardingRequiredRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

describe('dashboard page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearStoredToken();
    localStorage.clear();
    setStoredToken('token-complete');
    vi.mocked(authApi.getCurrentUser).mockResolvedValue(completeUser);
    vi.mocked(coinsApi.getSupportedCoins).mockResolvedValue({
      items: [{ id: 1, coingeckoId: 'bitcoin', symbol: 'btc', name: 'Bitcoin' }],
    });
    vi.mocked(dashboardApi.getDashboard).mockResolvedValue(mockDashboardResponse);
  });

  it('shows loading skeleton before dashboard data arrives', () => {
    vi.mocked(dashboardApi.getDashboard).mockImplementation(
      () => new Promise(() => undefined),
    );

    renderWithProviders(<DashboardPage />, {
      routerProps: { initialEntries: ['/dashboard'] },
    });

    expect(screen.getByLabelText('Loading dashboard')).toBeInTheDocument();
  });

  it('renders all dashboard sections on success', async () => {
    renderWithProviders(<DashboardPage />, {
      routerProps: { initialEntries: ['/dashboard'] },
    });

    expect(await screen.findByRole('heading', { name: 'Market News' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Coin Prices' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'AI Insight of the Day' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Fun Crypto Meme' })).toBeInTheDocument();
  });

  it('shows the authenticated user name in the header', async () => {
    renderWithProviders(<DashboardPage />, {
      routerProps: { initialEntries: ['/dashboard'] },
    });

    expect(await screen.findByText('Alex')).toBeInTheDocument();
  });

  it('renders market prices with positive and negative percentage values', async () => {
    renderWithProviders(<DashboardPage />, {
      routerProps: { initialEntries: ['/dashboard'] },
    });

    await screen.findByText('Bitcoin');
    expect(screen.getByText('$65,823.12')).toBeInTheDocument();
    expect(screen.getByLabelText('24 hour change +2.17%')).toBeInTheDocument();
    expect(screen.getByLabelText('24 hour change -1.20%')).toBeInTheDocument();
  });

  it('renders news items without image or description safely', async () => {
    renderWithProviders(<DashboardPage />, {
      routerProps: { initialEntries: ['/dashboard'] },
    });

    const link = await screen.findByRole('link', { name: 'Bitcoin market update' });
    expect(link).toHaveAttribute('href', 'https://example.com/news/bitcoin');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getByText(/Crypto Daily/)).toBeInTheDocument();
    expect(screen.queryByText('relatedCoins')).not.toBeInTheDocument();
  });

  it('renders insight title, text, and disclaimer', async () => {
    renderWithProviders(<DashboardPage />, {
      routerProps: { initialEntries: ['/dashboard'] },
    });

    expect(await screen.findByRole('heading', { name: 'Bitcoin and Ethereum Update' })).toBeInTheDocument();
    expect(screen.getByText(/Bitcoin rose 2.2%/)).toBeInTheDocument();
    expect(
      screen.getByText('For educational purposes only. Not financial advice.'),
    ).toBeInTheDocument();
  });

  it('renders meme image and source link', async () => {
    renderWithProviders(<DashboardPage />, {
      routerProps: { initialEntries: ['/dashboard'] },
    });

    expect(
      await screen.findByRole('img', {
        name: 'Meme: BTC moved 2.2% in 24 hours. Me checking the dashboard again',
      }),
    ).toBeInTheDocument();

    const sourceLink = screen.getByRole('link', { name: 'View source' });
    expect(sourceLink).toHaveAttribute('href', 'https://example.com/meme-source');
    expect(sourceLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders disabled section state with preferences link', async () => {
    vi.mocked(dashboardApi.getDashboard).mockResolvedValue(
      createDashboardResponse({
        meme: { status: 'disabled' },
      }),
    );

    renderWithProviders(<DashboardPage />, {
      routerProps: { initialEntries: ['/dashboard'] },
    });

    expect(
      await screen.findByText('Crypto Meme is hidden in your preferences.'),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Preferences' }).length).toBeGreaterThan(0);
  });

  it('renders unavailable section without removing successful sections', async () => {
    vi.mocked(dashboardApi.getDashboard).mockResolvedValue(
      createDashboardResponse({
        market: {
          status: 'unavailable',
          message: 'Market data is temporarily unavailable',
        },
      }),
    );

    renderWithProviders(<DashboardPage />, {
      routerProps: { initialEntries: ['/dashboard'] },
    });

    expect(await screen.findByText('Market data is temporarily unavailable.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Market News' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'AI Insight of the Day' })).toBeInTheDocument();
  });

  it('renders stale notices for market and news', async () => {
    vi.mocked(dashboardApi.getDashboard).mockResolvedValue(
      createDashboardResponse({
        market: {
          ...mockDashboardResponse.market,
          isStale: true,
        },
        news: {
          ...mockDashboardResponse.news,
          isStale: true,
        },
      }),
    );

    renderWithProviders(<DashboardPage />, {
      routerProps: { initialEntries: ['/dashboard'] },
    });

    expect(await screen.findByText('Showing the latest available market data')).toBeInTheDocument();
    expect(screen.getByText('Showing the latest available news')).toBeInTheDocument();
  });

  it('shows empty states for valid empty market and news arrays', async () => {
    vi.mocked(dashboardApi.getDashboard).mockResolvedValue(
      createDashboardResponse({
        market: { status: 'available', items: [], isStale: false },
        news: { status: 'available', items: [], isStale: false, nextPage: null },
      }),
    );

    renderWithProviders(<DashboardPage />, {
      routerProps: { initialEntries: ['/dashboard'] },
    });

    expect(
      await screen.findByText('No market data is available for your selected coins.'),
    ).toBeInTheDocument();
    expect(screen.getByText('No relevant news was found right now.')).toBeInTheDocument();
  });

  it('shows retry state on whole-request failure', async () => {
    vi.mocked(dashboardApi.getDashboard).mockRejectedValue(
      new ApiError('Unable to reach the server. Please try again later.'),
    );

    renderWithProviders(<DashboardPage />, {
      routerProps: { initialEntries: ['/dashboard'] },
    });

    expect(await screen.findByRole('heading', { name: 'Unable to load dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    expect(screen.queryByText('AxiosError')).not.toBeInTheDocument();
  });

  it('redirects to onboarding on 409 response', async () => {
    const incompleteUser = {
      id: 2,
      name: 'Alex',
      email: 'alex@example.com',
      onboardingCompleted: false,
    };

    vi.mocked(authApi.getCurrentUser)
      .mockResolvedValueOnce(completeUser)
      .mockResolvedValue(incompleteUser);
    vi.mocked(dashboardApi.getDashboard).mockRejectedValue(
      new ApiError('Complete onboarding before accessing the dashboard.', { statusCode: 409 }),
    );

    renderWithProviders(<DashboardRoutes />, {
      routerProps: { initialEntries: ['/dashboard'] },
    });

    await waitFor(() => {
      expect(screen.getByText('Investor profile')).toBeInTheDocument();
    });
  });

  it('refresh triggers one additional dashboard request', async () => {
    const user = userEvent.setup();

    renderWithProviders(<DashboardPage />, {
      routerProps: { initialEntries: ['/dashboard'] },
    });

    await screen.findByRole('heading', { name: 'Coin Prices' });
    expect(dashboardApi.getDashboard).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Refresh dashboard' }));

    await waitFor(() => {
      expect(dashboardApi.getDashboard).toHaveBeenCalledTimes(2);
    });
  });

  it('does not expose provider fields or secrets', async () => {
    renderWithProviders(<DashboardPage />, {
      routerProps: { initialEntries: ['/dashboard'] },
    });

    await screen.findByRole('heading', { name: 'Market News' });

    expect(screen.queryByText(/coingeckoId/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/accessToken/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Bearer/i)).not.toBeInTheDocument();
  });
});
