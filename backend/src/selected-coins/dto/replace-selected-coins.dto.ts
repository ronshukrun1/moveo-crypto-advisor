import { ApiProperty } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsInt, IsPositive } from 'class-validator';

export class ReplaceSelectedCoinsDto {
  @ApiProperty({
    type: [Number],
    example: [1, 2, 3],
    description: 'Full replacement list of active coin IDs',
  })
  @IsArray()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  @ArrayUnique({ message: 'Duplicate coin IDs are not allowed' })
  coinIds: number[];
}
