import 'reflect-metadata';
import { validateEnvironment } from './validate-environment';
import { NodeEnvironment } from './environment-variables';

describe('validateEnvironment', () => {
  const validConfig = {
    PORT: '3000',
    NODE_ENV: NodeEnvironment.Development,
    FRONTEND_URL: 'http://localhost:5173',
    DB_HOST: 'localhost',
    DB_PORT: '5432',
    DB_USERNAME: 'moveo_user',
    DB_PASSWORD: 'change_me',
    DB_NAME: 'moveo_crypto_advisor',
  };

  it('accepts a valid configuration', () => {
    const result = validateEnvironment(validConfig);

    expect(result.PORT).toBe(3000);
    expect(result.DB_PORT).toBe(5432);
    expect(result.NODE_ENV).toBe(NodeEnvironment.Development);
  });

  it('rejects a missing database password', () => {
    const configWithoutPassword: Record<string, unknown> = { ...validConfig };
    delete configWithoutPassword.DB_PASSWORD;

    expect(() => validateEnvironment(configWithoutPassword)).toThrow(
      /Environment validation failed/,
    );
  });

  it('rejects an invalid database port', () => {
    expect(() =>
      validateEnvironment({
        ...validConfig,
        DB_PORT: 'not-a-number',
      }),
    ).toThrow(/Environment validation failed/);
  });

  it('rejects an unsupported NODE_ENV value', () => {
    expect(() =>
      validateEnvironment({
        ...validConfig,
        NODE_ENV: 'staging',
      }),
    ).toThrow(/Environment validation failed/);
  });

  it('does not include secret values in validation errors', () => {
    let thrown: Error | undefined;

    try {
      validateEnvironment({
        ...validConfig,
        DB_PASSWORD: '',
      });
    } catch (error) {
      thrown = error as Error;
    }

    expect(thrown).toBeDefined();
    expect(thrown?.message).toMatch(/Environment validation failed/);
    expect(thrown?.message).not.toContain('change_me');
  });
});
