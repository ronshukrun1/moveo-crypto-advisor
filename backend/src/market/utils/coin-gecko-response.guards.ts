import { BadGatewayException } from '@nestjs/common';
import { CoinGeckoMarketItem } from '../interfaces/coin-gecko-market-item.interface';

function isNullableNumber(value: unknown): value is number | null {
  return (
    value === null || (typeof value === 'number' && Number.isFinite(value))
  );
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

export function isCoinGeckoMarketItem(
  value: unknown,
): value is CoinGeckoMarketItem {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const item = value as Record<string, unknown>;

  return (
    typeof item.id === 'string' &&
    item.id.length > 0 &&
    typeof item.symbol === 'string' &&
    typeof item.name === 'string' &&
    isNullableString(item.image) &&
    isNullableNumber(item.current_price) &&
    isNullableNumber(item.market_cap) &&
    isNullableNumber(item.market_cap_rank) &&
    isNullableNumber(item.total_volume) &&
    isNullableNumber(item.high_24h) &&
    isNullableNumber(item.low_24h) &&
    isNullableNumber(item.price_change_24h) &&
    isNullableNumber(item.price_change_percentage_24h) &&
    isNullableString(item.last_updated)
  );
}

export function parseCoinGeckoMarketsResponse(
  data: unknown,
): CoinGeckoMarketItem[] {
  if (!Array.isArray(data)) {
    throw new BadGatewayException('Invalid market data received from provider');
  }

  return data.filter(isCoinGeckoMarketItem);
}
