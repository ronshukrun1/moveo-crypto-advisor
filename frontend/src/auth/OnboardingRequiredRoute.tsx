import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './auth-context';

export function OnboardingRequiredRoute() {
  const { user } = useAuth();
  const location = useLocation();

  if (user && !user.onboardingCompleted) {
    return <Navigate to="/onboarding" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
