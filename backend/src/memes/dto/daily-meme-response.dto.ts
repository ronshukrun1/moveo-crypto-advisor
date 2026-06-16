import { ApiProperty } from '@nestjs/swagger';

export class DailyMemeResponseDto {
  @ApiProperty({ example: 'https://i.imgflip.com/example.jpg' })
  imageUrl: string;

  @ApiProperty({ example: 'https://imgflip.com/i/example' })
  pageUrl: string;

  @ApiProperty({ example: 'BTC moved 2.2% in 24 hours' })
  textTop: string;

  @ApiProperty({ example: 'Me checking the dashboard again' })
  textBottom: string;

  @ApiProperty({ example: '2026-06-16T10:00:00.000Z' })
  generatedAt: string;
}
