import { describe, expect, it } from 'vitest';
import { getAuthenticatedRedirectPath, getPostLoginPath } from './routing';
import type { User } from '../types/user';

const incompleteUser: User = {
  id: 1,
  name: 'Ron',
  email: 'ron@example.com',
  onboardingCompleted: false,
};

const completeUser: User = {
  id: 2,
  name: 'Alex',
  email: 'alex@example.com',
  onboardingCompleted: true,
};

describe('auth routing', () => {
  it('redirects incomplete users to onboarding', () => {
    expect(getAuthenticatedRedirectPath(incompleteUser)).toBe('/onboarding');
    expect(getPostLoginPath(incompleteUser)).toBe('/onboarding');
  });

  it('redirects completed users to dashboard', () => {
    expect(getAuthenticatedRedirectPath(completeUser)).toBe('/dashboard');
    expect(getPostLoginPath(completeUser)).toBe('/dashboard');
  });

  it('preserves safe destination for completed users', () => {
    expect(getPostLoginPath(completeUser, '/preferences')).toBe('/preferences');
    expect(getPostLoginPath(completeUser, '/onboarding')).toBe('/dashboard');
  });
});
