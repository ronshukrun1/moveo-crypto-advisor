import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Cache } from 'cache-manager';

@Injectable()
export class SafeCacheService {
  private readonly logger = new Logger(SafeCacheService.name);

  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  async get<T>(key: string): Promise<T | undefined> {
    try {
      return await this.cacheManager.get<T>(key);
    } catch {
      this.logger.warn('Cache read failed');
      return undefined;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttlSeconds * 1000);
    } catch {
      this.logger.warn('Cache write failed');
    }
  }
}
