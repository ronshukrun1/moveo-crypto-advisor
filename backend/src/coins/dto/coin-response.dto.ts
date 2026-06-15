import { ApiProperty } from '@nestjs/swagger';

export class CoinItemDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'bitcoin' })
  coingeckoId: string;

  @ApiProperty({ example: 'BTC' })
  symbol: string;

  @ApiProperty({ example: 'Bitcoin' })
  name: string;
}

export class CoinsListResponseDto {
  @ApiProperty({ type: [CoinItemDto] })
  items: CoinItemDto[];
}
