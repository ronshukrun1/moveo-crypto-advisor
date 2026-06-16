import { describe, expect, it } from 'vitest';
import {
  hasFieldErrors,
  validateLoginForm,
  validateRegisterForm,
} from '../auth/auth-validation';

describe('auth-validation', () => {
  it('requires all register fields', () => {
    const errors = validateRegisterForm({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    });

    expect(errors.name).toBeTruthy();
    expect(errors.email).toBeTruthy();
    expect(errors.password).toBeTruthy();
    expect(errors.confirmPassword).toBeTruthy();
    expect(hasFieldErrors(errors)).toBe(true);
  });

  it('blocks submission when passwords do not match', () => {
    const errors = validateRegisterForm({
      name: 'Ron',
      email: 'ron@example.com',
      password: 'StrongPass123!',
      confirmPassword: 'DifferentPass123!',
    });

    expect(errors.confirmPassword).toBe('Passwords do not match');
    expect(hasFieldErrors(errors)).toBe(true);
  });

  it('enforces backend password minimum length', () => {
    const errors = validateRegisterForm({
      name: 'Ron',
      email: 'ron@example.com',
      password: 'short',
      confirmPassword: 'short',
    });

    expect(errors.password).toContain('at least 8 characters');
  });

  it('validates login email and password', () => {
    const errors = validateLoginForm({ email: '', password: '' });
    expect(errors.email).toBeTruthy();
    expect(errors.password).toBeTruthy();
  });
});
