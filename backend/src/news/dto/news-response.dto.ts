import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NewsItemDto {
  @ApiProperty({ example: 'article-id' })
  id: string;

  @ApiProperty({ example: 'Bitcoin market update' })
  title: string;

  @ApiPropertyOptional({ example: 'Short description', nullable: true })
  description: string | null;

  @ApiProperty({ example: 'https://example.com/article' })
  url: string;

  @ApiPropertyOptional({
    example: 'https://example.com/image.jpg',
    nullable: true,
  })
  imageUrl: string | null;

  @ApiPropertyOptional({ example: 'Source Name', nullable: true })
  sourceName: string | null;

  @ApiPropertyOptional({ example: 'https://example.com', nullable: true })
  sourceUrl: string | null;

  @ApiPropertyOptional({
    type: [String],
    example: ['Author Name'],
    nullable: true,
  })
  creator: string[] | null;

  @ApiPropertyOptional({
    type: [String],
    example: ['BTC'],
    nullable: true,
  })
  relatedCoins: string[] | null;

  @ApiPropertyOptional({
    example: '2026-06-14T19:30:38.000Z',
    nullable: true,
  })
  publishedAt: string | null;

  @ApiProperty({ example: 'article-id' })
  feedbackContentId: string;
}

export class NewsListResponseDto {
  @ApiProperty({ type: [NewsItemDto] })
  items: NewsItemDto[];

  @ApiPropertyOptional({
    example: 'opaque-token-or-null',
    nullable: true,
  })
  nextPage: string | null;
}
