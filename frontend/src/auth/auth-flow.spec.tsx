import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router-dom';
import { RegisterPage } from '../pages/RegisterPage';
import { LoginPage } from '../pages/LoginPage';
import { OnboardingPage } from '../pages/OnboardingPage';
import { DashboardPage } from '../pages/DashboardPage';
import { ProtectedRoute } from '../auth/ProtectedRoute';
import { PublicAuthRoute } from '../auth/PublicAuthRoute';
import { OnboardingRequiredRoute } from '../auth/OnboardingRequiredRoute';
import { OnboardingOnlyRoute } from '../auth/OnboardingOnlyRoute';
import { renderWithProviders } from '../test/test-utils';
import * as authApi from '../api/auth';
import * as coinsApi from '../api/coins';
import * as dashboardApi from '../api/dashboard';
import { setStoredToken, clearStoredToken } from '../auth/auth-storage';
import { ApiError } from '../api/api-error';
import { mockDashboardResponse } from '../dashboard/dashboard.fixtures';

vi.mock('../api/auth');
vi.mock('../api/coins');
vi.mock('../api/dashboard');

const incompleteUser = {
  id: 1,
  name: 'Ron',
  email: 'ron@example.com',
  onboardingCompleted: false,
};

const completeUser = {
  id: 2,
  name: 'Alex',
  email: 'alex@example.com',
  onboardingCompleted: true,
};

function AuthRoutes() {
  return (
    <Routes>
      <Route element={<PublicAuthRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

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

describe('authentication flows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearStoredToken();
    localStorage.clear();
    vi.mocked(coinsApi.getSupportedCoins).mockResolvedValue({
      items: [{ id: 1, coingeckoId: 'bitcoin', symbol: 'btc', name: 'Bitcoin' }],
    });
    vi.mocked(dashboardApi.getDashboard).mockResolvedValue(mockDashboardResponse);
  });

  it('register form includes name, email, password, and confirm password fields', () => {
    renderWithProviders(<RegisterPage />, { routerProps: { initialEntries: ['/register'] } });

    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
  });

  it('does not send confirmPassword to backend', async () => {
    const user = userEvent.setup();
    const registerSpy = vi.mocked(authApi.registerUser).mockResolvedValue({
      message: 'User registered successfully',
      user: incompleteUser,
    });

    renderWithProviders(<RegisterPage />, { routerProps: { initialEntries: ['/register'] } });

    await user.type(screen.getByLabelText('Name'), 'Ron');
    await user.type(screen.getByLabelText('Email'), 'ron@example.com');
    await user.type(screen.getByLabelText('Password'), 'StrongPass123!');
    await user.type(screen.getByLabelText('Confirm Password'), 'StrongPass123!');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => {
      expect(registerSpy).toHaveBeenCalledWith({
        name: 'Ron',
        email: 'ron@example.com',
        password: 'StrongPass123!',
      });
    });

    expect(registerSpy.mock.calls[0][0]).not.toHaveProperty('confirmPassword');
  });

  it('redirects to login with success message after registration', async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.registerUser).mockResolvedValue({
      message: 'User registered successfully',
      user: incompleteUser,
    });

    renderWithProviders(<AuthRoutes />, { routerProps: { initialEntries: ['/register'] } });

    await user.type(screen.getByLabelText('Name'), 'Ron');
    await user.type(screen.getByLabelText('Email'), 'ron@example.com');
    await user.type(screen.getByLabelText('Password'), 'StrongPass123!');
    await user.type(screen.getByLabelText('Confirm Password'), 'StrongPass123!');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText('Account created successfully. You can now sign in.')).toBeInTheDocument();
  });

  it('shows duplicate email message on 409', async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.registerUser).mockRejectedValue(
      new ApiError('Conflict', { statusCode: 409 }),
    );

    renderWithProviders(<RegisterPage />, { routerProps: { initialEntries: ['/register'] } });

    await user.type(screen.getByLabelText('Name'), 'Ron');
    await user.type(screen.getByLabelText('Email'), 'ron@example.com');
    await user.type(screen.getByLabelText('Password'), 'StrongPass123!');
    await user.type(screen.getByLabelText('Confirm Password'), 'StrongPass123!');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText('An account with this email already exists')).toBeInTheDocument();
  });

  it('stores token, loads /auth/me, and redirects incomplete users to onboarding', async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.loginUser).mockResolvedValue({
      message: 'Login successful',
      accessToken: 'token-123',
      user: incompleteUser,
    });
    vi.mocked(authApi.getCurrentUser).mockResolvedValue(incompleteUser);

    renderWithProviders(<AuthRoutes />, { routerProps: { initialEntries: ['/login'] } });

    await user.type(screen.getByLabelText('Email'), 'ron@example.com');
    await user.type(screen.getByLabelText('Password'), 'StrongPass123!');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(authApi.getCurrentUser).toHaveBeenCalled();
    });

    expect(await screen.findByText('Personalize your crypto dashboard')).toBeInTheDocument();
    expect(localStorage.getItem('accessToken')).toBe('token-123');
  });

  it('redirects completed users to dashboard', async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.loginUser).mockResolvedValue({
      message: 'Login successful',
      accessToken: 'token-456',
      user: completeUser,
    });
    vi.mocked(authApi.getCurrentUser).mockResolvedValue(completeUser);

    renderWithProviders(<AuthRoutes />, { routerProps: { initialEntries: ['/login'] } });

    await user.type(screen.getByLabelText('Email'), 'alex@example.com');
    await user.type(screen.getByLabelText('Password'), 'StrongPass123!');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Alex')).toBeInTheDocument();
  });

  it('loads current user when an existing token is present', async () => {
    setStoredToken('existing-token');
    vi.mocked(authApi.getCurrentUser).mockResolvedValue(completeUser);

    renderWithProviders(<AuthRoutes />, { routerProps: { initialEntries: ['/dashboard'] } });

    expect(await screen.findByText('Alex')).toBeInTheDocument();
    expect(authApi.getCurrentUser).toHaveBeenCalled();
  });

  it('clears invalid token state on startup', async () => {
    setStoredToken('invalid-token');
    vi.mocked(authApi.getCurrentUser).mockRejectedValue(
      new ApiError('Unauthorized', { statusCode: 401 }),
    );

    renderWithProviders(<AuthRoutes />, { routerProps: { initialEntries: ['/dashboard'] } });

    expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
    expect(localStorage.getItem('accessToken')).toBeNull();
  });

  it('redirects unauthenticated users from protected routes', async () => {
    renderWithProviders(<AuthRoutes />, { routerProps: { initialEntries: ['/dashboard'] } });

    expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
  });

  it('prevents completed users from returning to onboarding', async () => {
    setStoredToken('token-complete');
    vi.mocked(authApi.getCurrentUser).mockResolvedValue(completeUser);

    renderWithProviders(<AuthRoutes />, { routerProps: { initialEntries: ['/onboarding'] } });

    expect(await screen.findByText('Alex')).toBeInTheDocument();
  });

  it('logout clears token and returns to login', async () => {
    const user = userEvent.setup();
    setStoredToken('token-complete');
    vi.mocked(authApi.getCurrentUser).mockResolvedValue(completeUser);

    renderWithProviders(<AuthRoutes />, { routerProps: { initialEntries: ['/dashboard'] } });

    await screen.findByText('Alex');
    await user.click(screen.getByRole('button', { name: 'Sign out' }));

    expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
    expect(localStorage.getItem('accessToken')).toBeNull();
  });
});
