import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { INestApplication } from '@nestjs/common';
import type { Cache } from 'cache-manager';

export async function clearAppCache(app: INestApplication): Promise<void> {
  const cacheManager = app.get<Cache>(CACHE_MANAGER);
  await cacheManager.clear();
}
