import { useEffect } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LoadingState } from '../components/states/LoadingState';
import { ErrorState } from '../components/states/ErrorState';
import { useAuth } from './auth-context';

export function ProtectedRoute() {
  const { isAuthenticated, isInitializing, initError, retryInitialization } = useAuth();
  const location = useLocation();

  if (isInitializing) {
    return <LoadingState message="Checking your session…" />;
  }

  if (initError) {
    return (
      <ErrorState
        title="Unable to load your account"
        message="We could not verify your session. Please try again."
        actionLabel="Retry"
        onAction={() => {
          void retryInitialization();
        }}
      />
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

export function AuthSessionRedirect() {
  const { isAuthenticated, isInitializing, sessionExpired, acknowledgeSessionExpired } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isInitializing || isAuthenticated || !sessionExpired) {
      return;
    }

    if (location.pathname === '/login' || location.pathname === '/register') {
      acknowledgeSessionExpired();
      return;
    }

    navigate('/login', {
      replace: true,
      state: { sessionExpired: true, from: location.pathname },
    });
    acknowledgeSessionExpired();
  }, [
    acknowledgeSessionExpired,
    isAuthenticated,
    isInitializing,
    location.pathname,
    navigate,
    sessionExpired,
  ]);

  return null;
}
