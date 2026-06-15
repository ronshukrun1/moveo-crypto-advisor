import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MarketItemDto {
  @ApiProperty({ example: 'bitcoin' })
  id: string;

  @ApiProperty({ example: 'BTC' })
  symbol: string;

  @ApiProperty({ example: 'Bitcoin' })
  name: string;

  @ApiPropertyOptional({
    example: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
  })
  imageUrl: string | null;

  @ApiPropertyOptional({ example: 65823 })
  currentPrice: number | null;

  @ApiPropertyOptional({ example: 1319912956634 })
  marketCap: number | null;

  @ApiPropertyOptional({ example: 1 })
  marketCapRank: number | null;

  @ApiPropertyOptional({ example: 25204772698 })
  totalVolume: number | null;

  @ApiPropertyOptional({ example: 65893 })
  high24h: number | null;

  @ApiPropertyOptional({ example: 63663 })
  low24h: number | null;

  @ApiPropertyOptional({ example: 1395.9 })
  priceChange24h: number | null;

  @ApiPropertyOptional({ example: 2.17 })
  changePercentage24h: number | null;

  @ApiPropertyOptional({ example: '2026-06-15T06:11:30.617Z' })
  lastUpdated: string | null;
}

export class MarketListResponseDto {
  @ApiProperty({ type: [MarketItemDto] })
  items: MarketItemDto[];
}
