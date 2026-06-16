import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthSessionRedirect, ProtectedRoute } from '../auth/ProtectedRoute';
import { PublicAuthRoute } from '../auth/PublicAuthRoute';
import { OnboardingRequiredRoute } from '../auth/OnboardingRequiredRoute';
import { OnboardingOnlyRoute } from '../auth/OnboardingOnlyRoute';
import { DashboardPage } from '../pages/DashboardPage';
import { ForbiddenPage } from '../pages/ForbiddenPage';
import { LandingPage } from '../pages/LandingPage';
import { LoginPage } from '../pages/LoginPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { OnboardingPage } from '../pages/OnboardingPage';
import { PreferencesPage } from '../pages/PreferencesPage';
import { RegisterPage } from '../pages/RegisterPage';

export function AppRouter() {
  return (
    <>
      <AuthSessionRedirect />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/forbidden" element={<ForbiddenPage />} />

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
            <Route path="/preferences" element={<PreferencesPage />} />
          </Route>
        </Route>

        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}
