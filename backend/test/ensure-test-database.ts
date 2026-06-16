import { DataSource } from 'typeorm';
import { validateEnvironment } from '../src/config/validate-environment';
import { buildTypeOrmOptions } from '../src/database/typeorm.config';
import { TEST_DATABASE_NAME } from './test-environment';

export async function ensureTestDatabase(
  env: NodeJS.ProcessEnv = process.env,
): Promise<void> {
  const validatedEnvironment = validateEnvironment({
    ...env,
    DB_NAME: TEST_DATABASE_NAME,
    NODE_ENV: 'test',
  });

  const adminDataSource = new DataSource({
    ...buildTypeOrmOptions(validatedEnvironment),
    database: 'postgres',
  });

  try {
    await adminDataSource.initialize();

    const existingDatabase = await adminDataSource.query<
      { '?column?': number }[]
    >('SELECT 1 FROM pg_database WHERE datname = $1', [TEST_DATABASE_NAME]);

    if (existingDatabase.length === 0) {
      await adminDataSource.query(`CREATE DATABASE "${TEST_DATABASE_NAME}"`);
    }
  } finally {
    if (adminDataSource.isInitialized) {
      await adminDataSource.destroy();
    }
  }

  const dataSource = new DataSource(buildTypeOrmOptions(validatedEnvironment));

  try {
    await dataSource.initialize();
    await dataSource.runMigrations();
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}
