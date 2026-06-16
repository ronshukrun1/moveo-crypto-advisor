import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DailyInsightResponseDto {
  @ApiProperty({ example: 'Bitcoin and Ethereum Update' })
  title: string;

  @ApiProperty({
    example:
      'Bitcoin rose 2.2% during the last 24 hours. Ethereum also moved higher while recent headlines reflected ongoing network and market activity.',
  })
  insight: string;

  @ApiProperty({
    example: 'For educational purposes only. Not financial advice.',
  })
  disclaimer: string;

  @ApiProperty({ example: '2026-06-16T10:00:00.000Z' })
  generatedAt: string;

  @ApiPropertyOptional({ example: 'daily-insight:123' })
  feedbackContentId?: string;
}
