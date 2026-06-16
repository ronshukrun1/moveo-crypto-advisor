const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
export const NAME_MAX_LENGTH = 100;

export interface RegisterFormValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginFormValues {
  email: string;
  password: string;
}

export type RegisterFieldErrors = Partial<Record<keyof RegisterFormValues, string>>;
export type LoginFieldErrors = Partial<Record<keyof LoginFormValues, string>>;

export function validateRegisterForm(values: RegisterFormValues): RegisterFieldErrors {
  const errors: RegisterFieldErrors = {};
  const trimmedName = values.name.trim();
  const trimmedEmail = values.email.trim();

  if (!trimmedName) {
    errors.name = 'Name is required';
  } else if (trimmedName.length > NAME_MAX_LENGTH) {
    errors.name = `Name must be at most ${NAME_MAX_LENGTH} characters`;
  }

  if (!trimmedEmail) {
    errors.email = 'Email is required';
  } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
    errors.email = 'Enter a valid email address';
  }

  if (!values.password) {
    errors.password = 'Password is required';
  } else if (values.password.length < PASSWORD_MIN_LENGTH) {
    errors.password = `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
  } else if (values.password.length > PASSWORD_MAX_LENGTH) {
    errors.password = `Password must be at most ${PASSWORD_MAX_LENGTH} characters`;
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = 'Confirm password is required';
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return errors;
}

export function validateLoginForm(values: LoginFormValues): LoginFieldErrors {
  const errors: LoginFieldErrors = {};
  const trimmedEmail = values.email.trim();

  if (!trimmedEmail) {
    errors.email = 'Email is required';
  } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
    errors.email = 'Enter a valid email address';
  }

  if (!values.password) {
    errors.password = 'Password is required';
  }

  return errors;
}

export function hasFieldErrors<T extends Record<string, string | undefined>>(
  errors: T,
): boolean {
  return Object.values(errors).some(Boolean);
}

export function mapBackendValidationToRegisterFields(
  messages: string[] | undefined,
): RegisterFieldErrors {
  if (!messages?.length) {
    return {};
  }

  const errors: RegisterFieldErrors = {};

  for (const message of messages) {
    const lower = message.toLowerCase();

    if (lower.includes('name')) {
      errors.name = message;
    } else if (lower.includes('email')) {
      errors.email = message;
    } else if (lower.includes('password')) {
      errors.password = message;
    }
  }

  return errors;
}
