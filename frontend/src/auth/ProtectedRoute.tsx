import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { LoadingState } from '../components/states/LoadingState';
import { useAuth } from './auth-context';

export function ProtectedRoute() {
  const { isAuthenticated, isInitializing } = useAuth();
  const location = useLocation();

  if (isInitializing) {
    return <LoadingState message="Checking your session…" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
