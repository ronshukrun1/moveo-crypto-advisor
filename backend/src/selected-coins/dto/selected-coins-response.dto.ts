import { ApiProperty } from '@nestjs/swagger';
import { CoinItemDto } from '../../coins/dto/coin-response.dto';

export class SelectedCoinsListResponseDto {
  @ApiProperty({ type: [CoinItemDto] })
  items: CoinItemDto[];
}

export class ReplaceSelectedCoinsResponseDto {
  @ApiProperty({ example: 'Selected coins updated successfully' })
  message: string;

  @ApiProperty({ type: [CoinItemDto] })
  items: CoinItemDto[];
}
