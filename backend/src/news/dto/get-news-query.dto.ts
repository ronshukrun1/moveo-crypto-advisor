import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class GetNewsQueryDto {
  @ApiPropertyOptional({
    description: 'Opaque NewsData pagination token',
    example: 'next-page-token',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  page?: string;

  @ApiPropertyOptional({
    description: 'Maximum number of articles to return',
    example: 5,
    minimum: 1,
    maximum: 10,
    default: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  limit?: number;
}
