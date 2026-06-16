import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router-dom';
import { PreferencesPage } from '../pages/PreferencesPage';
import { DashboardPage } from '../pages/DashboardPage';
import { ProtectedRoute } from '../auth/ProtectedRoute';
import { OnboardingRequiredRoute } from '../auth/OnboardingRequiredRoute';
import { OnboardingOnlyRoute } from '../auth/OnboardingOnlyRoute';
import { OnboardingPage } from '../pages/OnboardingPage';
import { renderWithProviders } from '../test/test-utils';
import * as authApi from '../api/auth';
import * as coinsApi from '../api/coins';
import * as preferencesApi from '../api/preferences';
import * as selectedCoinsApi from '../api/selected-coins';
import * as dashboardApi from '../api/dashboard';
import { ApiError } from '../api/api-error';
import { setStoredToken, clearStoredToken } from '../auth/auth-storage';
import {
  createPreferencesRecord,
  mockSelectedCoins,
  mockSupportedCoins,
} from './preferences.fixtures';
import { mockDashboardResponse } from '../dashboard/dashboard.fixtures';
import { CONTENT_PREFERENCE_OPTIONS } from '../onboarding/constants';

vi.mock('../api/auth');
vi.mock('../api/coins');
vi.mock('../api/preferences');
vi.mock('../api/selected-coins');
vi.mock('../api/dashboard');

const completeUser = {
  id: 2,
  name: 'Alex',
  email: 'alex@example.com',
  onboardingCompleted: true,
};

function PreferencesRoutes() {
  return (
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route element={<OnboardingOnlyRoute />}>
          <Route path="/onboarding" element={<OnboardingPage />} />
        </Route>
        <Route element={<OnboardingRequiredRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/preferences" element={<PreferencesPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

async function waitForPreferencesReady() {
  await screen.findByRole('heading', { name: 'Dashboard Preferences' });
  await screen.findByRole('button', { name: 'Save Changes' });
}

describe('preferences page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearStoredToken();
    localStorage.clear();
    setStoredToken('token-complete');
    vi.mocked(authApi.getCurrentUser).mockResolvedValue(completeUser);
    vi.mocked(coinsApi.getSupportedCoins).mockResolvedValue(mockSupportedCoins);
    vi.mocked(preferencesApi.getPreferences).mockResolvedValue(
      createPreferencesRecord(),
    );
    vi.mocked(selectedCoinsApi.getSelectedCoins).mockResolvedValue(mockSelectedCoins);
    vi.mocked(dashboardApi.getDashboard).mockResolvedValue(mockDashboardResponse);
    vi.mocked(preferencesApi.updatePreferences).mockResolvedValue({
      message: 'Preferences updated successfully',
      preferences: createPreferencesRecord({ showMeme: true }),
    });
    vi.mocked(selectedCoinsApi.replaceSelectedCoins).mockResolvedValue({
      message: 'Selected coins updated successfully',
      items: mockSupportedCoins.items.slice(0, 1),
    });
  });

  it('loads preferences, selected coins, and supported coins on mount', async () => {
    renderWithProviders(<PreferencesPage />, {
      routerProps: { initialEntries: ['/preferences'] },
    });

    await waitForPreferencesReady();

    expect(preferencesApi.getPreferences).toHaveBeenCalledTimes(1);
    expect(selectedCoinsApi.getSelectedCoins).toHaveBeenCalledTimes(1);
    expect(coinsApi.getSupportedCoins).toHaveBeenCalledTimes(1);
  });

  it('shows a loading skeleton before data arrives', () => {
    vi.mocked(preferencesApi.getPreferences).mockImplementation(
      () => new Promise(() => undefined),
    );

    renderWithProviders(<PreferencesPage />, {
      routerProps: { initialEntries: ['/preferences'] },
    });

    expect(screen.getByLabelText('Loading preferences')).toBeInTheDocument();
  });

  it('shows a retryable whole-page error when initial load fails', async () => {
    vi.mocked(preferencesApi.getPreferences).mockRejectedValue(
      new ApiError('Unable to reach the server. Please try again later.'),
    );

    renderWithProviders(<PreferencesPage />, {
      routerProps: { initialEntries: ['/preferences'] },
    });

    expect(await screen.findByText('Unable to load preferences')).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Try again' }));
    expect(preferencesApi.getPreferences).toHaveBeenCalledTimes(2);
  });

  it('reflects investor profile, content flags, and selected coins from the backend', async () => {
    renderWithProviders(<PreferencesPage />, {
      routerProps: { initialEntries: ['/preferences'] },
    });

    await waitForPreferencesReady();

    expect(screen.getByRole('button', { name: /Long-Term Holder/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: /Crypto Meme/i })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(screen.getByRole('button', { name: /BTC/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /ETH/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('2 selected')).toBeInTheDocument();
  });

  it('disables save when there are no changes', async () => {
    renderWithProviders(<PreferencesPage />, {
      routerProps: { initialEntries: ['/preferences'] },
    });

    await waitForPreferencesReady();
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled();
  });

  it('calls only PATCH when only preferences change', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PreferencesPage />, {
      routerProps: { initialEntries: ['/preferences'] },
    });

    await waitForPreferencesReady();
    await user.click(screen.getByRole('button', { name: /Active Trader/i }));
    await user.click(screen.getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => {
      expect(preferencesApi.updatePreferences).toHaveBeenCalledWith({
        investorProfile: 'ACTIVE_TRADER',
      });
    });
    expect(selectedCoinsApi.replaceSelectedCoins).not.toHaveBeenCalled();
  });

  it('calls only PUT when only selected coins change', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PreferencesPage />, {
      routerProps: { initialEntries: ['/preferences'] },
    });

    await waitForPreferencesReady();
    await user.click(screen.getByRole('button', { name: /SOL/i }));
    await user.click(screen.getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => {
      expect(selectedCoinsApi.replaceSelectedCoins).toHaveBeenCalledWith({
        coinIds: [1, 2, 3],
      });
    });
    expect(preferencesApi.updatePreferences).not.toHaveBeenCalled();
  });

  it('calls both endpoints when profile and coins change', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PreferencesPage />, {
      routerProps: { initialEntries: ['/preferences'] },
    });

    await waitForPreferencesReady();
    await user.click(screen.getByRole('button', { name: /Beginner/i }));
    await user.click(screen.getByRole('button', { name: /ETH/i }));
    await user.click(screen.getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => {
      expect(preferencesApi.updatePreferences).toHaveBeenCalledWith({
        investorProfile: 'BEGINNER',
      });
      expect(selectedCoinsApi.replaceSelectedCoins).toHaveBeenCalledWith({
        coinIds: [1],
      });
    });
  });

  it('re-fetches canonical state after a successful save', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PreferencesPage />, {
      routerProps: { initialEntries: ['/preferences'] },
    });

    await waitForPreferencesReady();
    await user.click(screen.getByRole('button', { name: /Crypto Meme/i }));
    await user.click(screen.getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => {
      expect(preferencesApi.getPreferences).toHaveBeenCalledTimes(2);
      expect(selectedCoinsApi.getSelectedCoins).toHaveBeenCalledTimes(2);
      expect(coinsApi.getSupportedCoins).toHaveBeenCalledTimes(2);
    });
  });

  it('shows a success message after a full save', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PreferencesPage />, {
      routerProps: { initialEntries: ['/preferences'] },
    });

    await waitForPreferencesReady();
    await user.click(screen.getByRole('button', { name: /Crypto Meme/i }));
    await user.click(screen.getByRole('button', { name: 'Save Changes' }));

    expect(
      await screen.findByText('Your preferences were updated successfully.'),
    ).toBeInTheDocument();
  });

  it('shows partial failure when preferences save succeeds and coins fail', async () => {
    const user = userEvent.setup();
    vi.mocked(selectedCoinsApi.replaceSelectedCoins).mockRejectedValue(
      new ApiError('Invalid or inactive coin IDs: 3', {
        statusCode: 400,
        validationMessages: ['Invalid or inactive coin IDs: 3'],
      }),
    );

    renderWithProviders(<PreferencesPage />, {
      routerProps: { initialEntries: ['/preferences'] },
    });

    await waitForPreferencesReady();
    await user.click(screen.getByRole('button', { name: /Beginner/i }));
    await user.click(screen.getByRole('button', { name: /SOL/i }));
    await user.click(screen.getByRole('button', { name: 'Save Changes' }));

    expect(
      await screen.findByText(
        'Your profile settings were saved, but selected coins could not be updated.',
      ),
    ).toBeInTheDocument();
  });

  it('shows partial failure when coins save succeeds and preferences fail', async () => {
    const user = userEvent.setup();
    vi.mocked(preferencesApi.updatePreferences).mockRejectedValue(
      new ApiError('Please review your selections.', {
        statusCode: 400,
        validationMessages: ['investorProfile must be a valid enum value'],
      }),
    );

    renderWithProviders(<PreferencesPage />, {
      routerProps: { initialEntries: ['/preferences'] },
    });

    await waitForPreferencesReady();
    await user.click(screen.getByRole('button', { name: /Beginner/i }));
    await user.click(screen.getByRole('button', { name: /SOL/i }));
    await user.click(screen.getByRole('button', { name: 'Save Changes' }));

    expect(
      await screen.findByText(
        'Your selected coins were saved, but dashboard content settings could not be updated.',
      ),
    ).toBeInTheDocument();
  });

  it('shows a safe error when coin updates fail', async () => {
    const user = userEvent.setup();
    vi.mocked(selectedCoinsApi.replaceSelectedCoins).mockRejectedValue(
      new ApiError('Invalid or inactive coin IDs: 99', {
        statusCode: 400,
        validationMessages: ['Invalid or inactive coin IDs: 99'],
      }),
    );

    renderWithProviders(<PreferencesPage />, {
      routerProps: { initialEntries: ['/preferences'] },
    });

    await waitForPreferencesReady();
    await user.click(screen.getByRole('button', { name: /SOL/i }));
    await user.click(screen.getByRole('button', { name: 'Save Changes' }));

    expect(await screen.findByText('Unable to save your changes right now.')).toBeInTheDocument();
  });

  it('requires at least one selected coin before saving', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PreferencesPage />, {
      routerProps: { initialEntries: ['/preferences'] },
    });

    await waitForPreferencesReady();
    await user.click(screen.getByRole('button', { name: /BTC/i }));
    await user.click(screen.getByRole('button', { name: /ETH/i }));
    await user.click(screen.getByRole('button', { name: 'Save Changes' }));

    expect(await screen.findByText('Please select at least one coin.')).toBeInTheDocument();
    expect(selectedCoinsApi.replaceSelectedCoins).not.toHaveBeenCalled();
  });

  it('restores the original backend state when discarding changes', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PreferencesPage />, {
      routerProps: { initialEntries: ['/preferences'] },
    });

    await waitForPreferencesReady();
    await user.click(screen.getByRole('button', { name: /Active Trader/i }));
    await user.click(screen.getByRole('button', { name: 'Discard Changes' }));

    expect(screen.getByRole('button', { name: /Long-Term Holder/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled();
  });

  it('navigates back to the dashboard', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PreferencesRoutes />, {
      routerProps: { initialEntries: ['/preferences'] },
    });

    await waitForPreferencesReady();
    await user.click(screen.getByRole('button', { name: 'Back to Dashboard' }));

    expect(await screen.findByRole('heading', { name: 'Market News' })).toBeInTheDocument();
  });

  it('does not render unsupported content categories', async () => {
    renderWithProviders(<PreferencesPage />, {
      routerProps: { initialEntries: ['/preferences'] },
    });

    await waitForPreferencesReady();

    expect(screen.queryByText(/Charts/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Social Signals/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Sentiment/i)).not.toBeInTheDocument();
    expect(CONTENT_PREFERENCE_OPTIONS).toHaveLength(4);
  });

  it('uses existing session expiration handling on 401 during load', async () => {
    vi.mocked(preferencesApi.getPreferences).mockRejectedValue(
      new ApiError('Your session has expired. Please sign in again.', { statusCode: 401 }),
    );

    renderWithProviders(<PreferencesPage />, {
      routerProps: { initialEntries: ['/preferences'] },
    });

    await waitFor(() => {
      expect(authApi.getCurrentUser).toHaveBeenCalled();
    });
    expect(screen.queryByRole('button', { name: 'Save Changes' })).not.toBeInTheDocument();
  });
});
