import type { Cache } from 'cache-manager';
import { SafeCacheService } from './safe-cache.service';

describe('SafeCacheService', () => {
  it('returns undefined when cache read fails', async () => {
    const cacheManager = {
      get: jest.fn().mockRejectedValue(new Error('read failed')),
      set: jest.fn(),
    };
    const service = new SafeCacheService(cacheManager as unknown as Cache);

    await expect(service.get('market:test')).resolves.toBeUndefined();
  });

  it('swallows cache write failures', async () => {
    const cacheManager = {
      get: jest.fn(),
      set: jest.fn().mockRejectedValue(new Error('write failed')),
    };
    const service = new SafeCacheService(cacheManager as unknown as Cache);

    await expect(service.set('market:test', { items: [] }, 120)).resolves.toBe(
      undefined,
    );
  });
});
