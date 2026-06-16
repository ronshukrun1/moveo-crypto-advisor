import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './auth-context';

export function OnboardingOnlyRoute() {
  const { user } = useAuth();

  if (user?.onboardingCompleted) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
