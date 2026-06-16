import { Navigate, Outlet } from 'react-router-dom';
import { LoadingState } from '../components/states/LoadingState';
import { useAuth } from './auth-context';
import { getAuthenticatedRedirectPath } from './routing';

export function PublicAuthRoute() {
  const { isAuthenticated, isInitializing, user } = useAuth();

  if (isInitializing) {
    return <LoadingState message="Checking your session…" />;
  }

  if (isAuthenticated && user) {
    return <Navigate to={getAuthenticatedRedirectPath(user)} replace />;
  }

  return <Outlet />;
}
