import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AuthModule } from '../auth/auth.module';
import { SelectedCoinsModule } from '../selected-coins/selected-coins.module';
import { CoinGeckoClient } from './coin-gecko.client';
import { MarketController } from './market.controller';
import { MarketService } from './market.service';

@Module({
  imports: [HttpModule, SelectedCoinsModule, AuthModule],
  controllers: [MarketController],
  providers: [MarketService, CoinGeckoClient],
  exports: [CoinGeckoClient],
})
export class MarketModule {}
