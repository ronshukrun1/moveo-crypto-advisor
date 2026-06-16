import type { User } from '../types/user';

const PROTECTED_DESTINATIONS = new Set(['/dashboard', '/preferences', '/onboarding']);

export function getAuthenticatedRedirectPath(user: User): string {
  return user.onboardingCompleted ? '/dashboard' : '/onboarding';
}

export function getPostLoginPath(user: User, fromPath?: string): string {
  if (!user.onboardingCompleted) {
    return '/onboarding';
  }

  if (fromPath && PROTECTED_DESTINATIONS.has(fromPath) && fromPath !== '/onboarding') {
    return fromPath;
  }

  return '/dashboard';
}
