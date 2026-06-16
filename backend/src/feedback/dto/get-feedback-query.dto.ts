import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsOptional, IsString } from 'class-validator';

function parseContentIds(value: unknown): string[] {
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  if (Array.isArray(value)) {
    return value
      .flatMap((item) =>
        typeof item === 'string'
          ? item
              .split(',')
              .map((part) => part.trim())
              .filter((part) => part.length > 0)
          : [],
      )
      .filter((item) => item.length > 0);
  }

  return [];
}

export class GetFeedbackQueryDto {
  @ApiPropertyOptional({
    example: 'coin:1,article-id,daily-insight:123',
    description: 'Comma-separated feedback content IDs',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => parseContentIds(value))
  contentIds?: string[];
}
