import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { Global, Module } from '@nestjs/common';
import { SafeCacheService } from './safe-cache.service';

@Global()
@Module({
  imports: [
    NestCacheModule.register({
      isGlobal: true,
    }),
  ],
  providers: [SafeCacheService],
  exports: [SafeCacheService, NestCacheModule],
})
export class AppCacheModule {}
