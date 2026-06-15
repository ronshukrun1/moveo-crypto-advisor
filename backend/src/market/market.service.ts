import { Injectable } from '@nestjs/common';
import { SelectedCoinsService } from '../selected-coins/selected-coins.service';
import { MarketItemDto } from './dto/market-response.dto';
import { CoinGeckoClient } from './coin-gecko.client';
import { toMarketItemDto } from './mappers/market-response.mapper';

@Injectable()
export class MarketService {
  constructor(
    private readonly selectedCoinsService: SelectedCoinsService,
    private readonly coinGeckoClient: CoinGeckoClient,
  ) {}

  async getMarketData(userId: number): Promise<{ items: MarketItemDto[] }> {
    const { items: selectedCoins } =
      await this.selectedCoinsService.getSelectedCoins(userId);

    if (selectedCoins.length === 0) {
      return { items: [] };
    }

    const coingeckoIds = selectedCoins.map((coin) => coin.coingeckoId);
    const marketData = await this.coinGeckoClient.fetchMarkets(coingeckoIds);
    const marketDataById = new Map(marketData.map((item) => [item.id, item]));

    const items = selectedCoins
      .map((selectedCoin) => {
        const marketItem = marketDataById.get(selectedCoin.coingeckoId);

        if (!marketItem) {
          return null;
        }

        return toMarketItemDto(selectedCoin, marketItem);
      })
      .filter((item): item is MarketItemDto => item !== null);

    return { items };
  }
}
