import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router-dom';
import { OnboardingPage } from '../pages/OnboardingPage';
import { DashboardPage } from '../pages/DashboardPage';
import { ProtectedRoute } from '../auth/ProtectedRoute';
import { OnboardingOnlyRoute } from '../auth/OnboardingOnlyRoute';
import { OnboardingRequiredRoute } from '../auth/OnboardingRequiredRoute';
import { renderWithProviders } from '../test/test-utils';
import * as authApi from '../api/auth';
import * as coinsApi from '../api/coins';
import * as onboardingApi from '../api/onboarding';
import * as dashboardApi from '../api/dashboard';
import { setStoredToken, clearStoredToken } from '../auth/auth-storage';
import { ApiError } from '../api/api-error';
import { mockDashboardResponse } from '../dashboard/dashboard.fixtures';

vi.mock('../api/auth');
vi.mock('../api/coins');
vi.mock('../api/onboarding');
vi.mock('../api/dashboard');

const incompleteUser = {
  id: 1,
  name: 'Ron',
  email: 'ron@example.com',
  onboardingCompleted: false,
};

const completeUser = {
  id: 1,
  name: 'Ron',
  email: 'ron@example.com',
  onboardingCompleted: true,
};

const mockCoins = {
  items: [
    { id: 1, coingeckoId: 'bitcoin', symbol: 'btc', name: 'Bitcoin' },
    { id: 2, coingeckoId: 'ethereum', symbol: 'eth', name: 'Ethereum' },
    { id: 3, coingeckoId: 'solana', symbol: 'sol', name: 'Solana' },
  ],
};

function OnboardingRoutes() {
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

async function waitForOnboardingReady() {
  await screen.findByText('Investor profile');
}

async function completeFirstTwoSteps(user: ReturnType<typeof userEvent.setup>) {
  await waitForOnboardingReady();
  await user.click(screen.getByRole('button', { name: /Beginner/i }));
  await user.click(screen.getByRole('button', { name: 'Continue' }));
  await user.click(screen.getByRole('button', { name: 'Continue' }));
}

describe('onboarding flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearStoredToken();
    localStorage.clear();

    setStoredToken('token-incomplete');
    vi.mocked(authApi.getCurrentUser).mockResolvedValue(incompleteUser);
    vi.mocked(coinsApi.getSupportedCoins).mockResolvedValue(mockCoins);
    vi.mocked(dashboardApi.getDashboard).mockResolvedValue(mockDashboardResponse);
  });

  it('loads coins from GET /api/coins', async () => {
    renderWithProviders(<OnboardingRoutes />, {
      routerProps: { initialEntries: ['/onboarding'] },
    });

    await screen.findByText('Investor profile');

    const user = userEvent.setup();
    await completeFirstTwoSteps(user);

    await waitFor(() => {
      expect(coinsApi.getSupportedCoins).toHaveBeenCalled();
    });

    expect(await screen.findByText(/BTC/i)).toBeInTheDocument();
    expect(screen.getByText('Bitcoin')).toBeInTheDocument();
  });

  it('shows loading state while coins load on step 3', async () => {
    let resolveCoins: (value: typeof mockCoins) => void = () => undefined;
    vi.mocked(coinsApi.getSupportedCoins).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveCoins = resolve;
        }),
    );

    renderWithProviders(<OnboardingRoutes />, {
      routerProps: { initialEntries: ['/onboarding'] },
    });

    const user = userEvent.setup();
    await completeFirstTwoSteps(user);

    expect(await screen.findByText(/Loading supported coins/i)).toBeInTheDocument();

    resolveCoins(mockCoins);
    expect(await screen.findByText(/BTC/i)).toBeInTheDocument();
  });

  it('shows retry state when coin loading fails', async () => {
    vi.mocked(coinsApi.getSupportedCoins).mockRejectedValueOnce(
      new ApiError('Network error'),
    );

    renderWithProviders(<OnboardingRoutes />, {
      routerProps: { initialEntries: ['/onboarding'] },
    });

    const user = userEvent.setup();
    await completeFirstTwoSteps(user);

    expect(await screen.findByText('Unable to load coins')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('requires investor profile before continuing', async () => {
    renderWithProviders(<OnboardingRoutes />, {
      routerProps: { initialEntries: ['/onboarding'] },
    });

    await screen.findByText('Investor profile');

    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
  });

  it('allows only one investor profile selection', async () => {
    renderWithProviders(<OnboardingRoutes />, {
      routerProps: { initialEntries: ['/onboarding'] },
    });

    const user = userEvent.setup();
    await screen.findByText('Investor profile');

    const beginner = screen.getByRole('button', { name: /Beginner/i });
    const holder = screen.getByRole('button', { name: /Long-Term Holder/i });

    await user.click(beginner);
    expect(beginner).toHaveAttribute('aria-pressed', 'true');

    await user.click(holder);
    expect(holder).toHaveAttribute('aria-pressed', 'true');
    expect(beginner).toHaveAttribute('aria-pressed', 'false');
  });

  it('toggles content preferences', async () => {
    renderWithProviders(<OnboardingRoutes />, {
      routerProps: { initialEntries: ['/onboarding'] },
    });

    await waitForOnboardingReady();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Beginner/i }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    const marketPrices = screen.getByRole('button', { name: /Market Prices/i });
    expect(marketPrices).toHaveAttribute('aria-pressed', 'true');

    await user.click(marketPrices);
    expect(marketPrices).toHaveAttribute('aria-pressed', 'false');
  });

  it('requires at least one coin before completion', async () => {
    renderWithProviders(<OnboardingRoutes />, {
      routerProps: { initialEntries: ['/onboarding'] },
    });

    const user = userEvent.setup();
    await completeFirstTwoSteps(user);
    await screen.findByText(/BTC/i);

    expect(screen.getByRole('button', { name: 'Complete Setup' })).toBeDisabled();
  });

  it('preserves selections when navigating back and forward', async () => {
    renderWithProviders(<OnboardingRoutes />, {
      routerProps: { initialEntries: ['/onboarding'] },
    });

    const user = userEvent.setup();
    await waitForOnboardingReady();
    await user.click(screen.getByRole('button', { name: /Active Trader/i }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    const newsCard = screen.getByRole('button', { name: /Crypto News/i });
    await user.click(newsCard);
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await screen.findByText(/BTC/i);
    await user.click(screen.getByRole('button', { name: /BTC/i }));
    await user.click(screen.getByRole('button', { name: 'Back' }));
    await user.click(screen.getByRole('button', { name: 'Back' }));

    expect(screen.getByRole('button', { name: /Active Trader/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByRole('button', { name: /Crypto News/i })).toHaveAttribute(
      'aria-pressed',
      'false',
    );

    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByRole('button', { name: /BTC/i })).toHaveAttribute('aria-pressed', 'true');
  });

  it('submits exact backend fields without extra properties', async () => {
    const completeSpy = vi.mocked(onboardingApi.completeOnboarding).mockResolvedValue({
      message: 'Onboarding completed successfully',
      onboardingCompleted: true,
      preferences: {
        investorProfile: 'BEGINNER',
        showMarketPrices: true,
        showNews: false,
        showAiInsight: true,
        showMeme: true,
      },
      selectedCoins: [mockCoins.items[0]],
    });
    vi.mocked(authApi.getCurrentUser)
      .mockResolvedValueOnce(incompleteUser)
      .mockResolvedValueOnce(completeUser);

    renderWithProviders(<OnboardingRoutes />, {
      routerProps: { initialEntries: ['/onboarding'] },
    });

    await waitForOnboardingReady();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Beginner/i }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click(screen.getByRole('button', { name: /Crypto News/i }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await screen.findByText(/BTC/i);
    await user.click(screen.getByRole('button', { name: /BTC/i }));
    await user.click(screen.getByRole('button', { name: 'Complete Setup' }));

    await waitFor(() => {
      expect(completeSpy).toHaveBeenCalledWith({
        investorProfile: 'BEGINNER',
        showMarketPrices: true,
        showNews: false,
        showAiInsight: true,
        showMeme: true,
        coinIds: [1],
      });
    });

    const payload = completeSpy.mock.calls[0][0];
    expect(payload).not.toHaveProperty('userId');
    expect(payload).not.toHaveProperty('confirmPassword');
    expect(payload.coinIds).not.toEqual(expect.arrayContaining([expect.objectContaining({ id: 1 })]));
  });

  it('calls refreshUser and redirects to dashboard on success', async () => {
    vi.mocked(onboardingApi.completeOnboarding).mockResolvedValue({
      message: 'Onboarding completed successfully',
      onboardingCompleted: true,
      preferences: {
        investorProfile: 'BEGINNER',
        showMarketPrices: true,
        showNews: true,
        showAiInsight: true,
        showMeme: true,
      },
      selectedCoins: [mockCoins.items[0]],
    });
    vi.mocked(authApi.getCurrentUser)
      .mockResolvedValueOnce(incompleteUser)
      .mockResolvedValueOnce(completeUser);

    renderWithProviders(<OnboardingRoutes />, {
      routerProps: { initialEntries: ['/onboarding'] },
    });

    await waitForOnboardingReady();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Beginner/i }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await screen.findByText(/BTC/i);
    await user.click(screen.getByRole('button', { name: /BTC/i }));
    await user.click(screen.getByRole('button', { name: 'Complete Setup' }));

    await waitFor(() => {
      expect(authApi.getCurrentUser).toHaveBeenCalledTimes(2);
    });

    expect(await screen.findByText('Ron')).toBeInTheDocument();
  });

  it('shows safe validation message on backend 400', async () => {
    vi.mocked(onboardingApi.completeOnboarding).mockRejectedValue(
      new ApiError('Bad Request', {
        statusCode: 400,
        validationMessages: ['One or more coin IDs are invalid or inactive'],
      }),
    );

    renderWithProviders(<OnboardingRoutes />, {
      routerProps: { initialEntries: ['/onboarding'] },
    });

    await waitForOnboardingReady();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Beginner/i }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await screen.findByText(/BTC/i);
    await user.click(screen.getByRole('button', { name: /BTC/i }));
    await user.click(screen.getByRole('button', { name: 'Complete Setup' }));

    expect(
      await screen.findByText('One or more selected coins are no longer available.'),
    ).toBeInTheDocument();
  });

  it('redirects completed users away from onboarding', async () => {
    vi.mocked(authApi.getCurrentUser).mockResolvedValue(completeUser);

    renderWithProviders(<OnboardingRoutes />, {
      routerProps: { initialEntries: ['/onboarding'] },
    });

    expect(await screen.findByText('Ron')).toBeInTheDocument();
    expect(screen.queryByText('Investor profile')).not.toBeInTheDocument();
  });

  it('submits unique coin IDs only', async () => {
    const completeSpy = vi.mocked(onboardingApi.completeOnboarding).mockResolvedValue({
      message: 'Onboarding completed successfully',
      onboardingCompleted: true,
      preferences: {
        investorProfile: 'BEGINNER',
        showMarketPrices: true,
        showNews: true,
        showAiInsight: true,
        showMeme: true,
      },
      selectedCoins: mockCoins.items.slice(0, 2),
    });
    vi.mocked(authApi.getCurrentUser)
      .mockResolvedValueOnce(incompleteUser)
      .mockResolvedValueOnce(completeUser);

    renderWithProviders(<OnboardingRoutes />, {
      routerProps: { initialEntries: ['/onboarding'] },
    });

    const user = userEvent.setup();
    await waitForOnboardingReady();
    await user.click(screen.getByRole('button', { name: /Beginner/i }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await screen.findByText(/BTC/i);

    await user.click(screen.getByRole('button', { name: /BTC/i }));
    await user.click(screen.getByRole('button', { name: /ETH/i }));
    await user.click(screen.getByRole('button', { name: 'Complete Setup' }));

    await waitFor(() => {
      expect(completeSpy).toHaveBeenCalled();
    });

    expect(completeSpy.mock.calls[0][0].coinIds).toEqual([1, 2]);
    expect(new Set(completeSpy.mock.calls[0][0].coinIds).size).toBe(2);
  });
});
