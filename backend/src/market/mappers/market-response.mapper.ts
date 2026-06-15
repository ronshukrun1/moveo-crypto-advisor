import { CoinItemDto } from '../../coins/dto/coin-response.dto';
import { MarketItemDto } from '../dto/market-response.dto';
import { CoinGeckoMarketItem } from '../interfaces/coin-gecko-market-item.interface';

export function toMarketItemDto(
  selectedCoin: CoinItemDto,
  marketData: CoinGeckoMarketItem,
): MarketItemDto {
  return {
    id: selectedCoin.coingeckoId,
    symbol: selectedCoin.symbol,
    name: selectedCoin.name,
    imageUrl: marketData.image,
    currentPrice: marketData.current_price,
    marketCap: marketData.market_cap,
    marketCapRank: marketData.market_cap_rank,
    totalVolume: marketData.total_volume,
    high24h: marketData.high_24h,
    low24h: marketData.low_24h,
    priceChange24h: marketData.price_change_24h,
    changePercentage24h: marketData.price_change_percentage_24h,
    lastUpdated: marketData.last_updated,
  };
}
