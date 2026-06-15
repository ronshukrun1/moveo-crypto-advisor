import { Coin } from '../entities/coin.entity';
import { CoinItemDto } from '../dto/coin-response.dto';

export function toCoinItemDto(coin: Coin): CoinItemDto {
  return {
    id: coin.id,
    coingeckoId: coin.coingeckoId,
    symbol: coin.symbol,
    name: coin.name,
  };
}
