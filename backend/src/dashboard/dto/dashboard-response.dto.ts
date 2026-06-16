import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InvestorProfile } from '../../preferences/enums/investor-profile.enum';
import { DailyInsightResponseDto } from '../../insights/dto/daily-insight-response.dto';
import { DailyMemeResponseDto } from '../../memes/dto/daily-meme-response.dto';
import { MarketItemDto } from '../../market/dto/market-response.dto';
import { NewsItemDto } from '../../news/dto/news-response.dto';

export class DashboardUserDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Ron' })
  name: string;

  @ApiProperty({ example: true })
  onboardingCompleted: boolean;
}

export class DashboardPreferencesDto {
  @ApiProperty({
    enum: InvestorProfile,
    example: InvestorProfile.LONG_TERM_HOLDER,
  })
  investorProfile: InvestorProfile;

  @ApiProperty({ example: true })
  showMarketPrices: boolean;

  @ApiProperty({ example: true })
  showNews: boolean;

  @ApiProperty({ example: true })
  showAiInsight: boolean;

  @ApiProperty({ example: true })
  showMeme: boolean;
}

export class DashboardSelectedCoinDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'bitcoin' })
  coingeckoId: string;

  @ApiProperty({ example: 'BTC' })
  symbol: string;

  @ApiProperty({ example: 'Bitcoin' })
  name: string;
}

export class DashboardDisabledSectionDto {
  @ApiProperty({ example: 'disabled', enum: ['disabled'] })
  status: 'disabled';
}

export class DashboardUnavailableSectionDto {
  @ApiProperty({ example: 'unavailable', enum: ['unavailable'] })
  status: 'unavailable';

  @ApiProperty({ example: 'Market data is temporarily unavailable' })
  message: string;
}

export class DashboardMarketSectionDto {
  @ApiProperty({
    example: 'available',
    enum: ['available', 'unavailable', 'disabled'],
  })
  status: 'available' | 'unavailable' | 'disabled';

  @ApiPropertyOptional({ type: [MarketItemDto] })
  items?: MarketItemDto[];

  @ApiPropertyOptional({
    example: false,
    description:
      'True when last-known cached market data was returned after a provider failure',
  })
  isStale?: boolean;

  @ApiPropertyOptional({ example: 'Market data is temporarily unavailable' })
  message?: string;
}

export class DashboardNewsSectionDto {
  @ApiProperty({
    example: 'available',
    enum: ['available', 'unavailable', 'disabled'],
  })
  status: 'available' | 'unavailable' | 'disabled';

  @ApiPropertyOptional({ type: [NewsItemDto] })
  items?: NewsItemDto[];

  @ApiPropertyOptional({ example: null, nullable: true })
  nextPage?: string | null;

  @ApiPropertyOptional({
    example: false,
    description:
      'True when last-known cached news data was returned after a provider failure',
  })
  isStale?: boolean;

  @ApiPropertyOptional({ example: 'News is temporarily unavailable' })
  message?: string;
}

export class DashboardInsightSectionDto {
  @ApiProperty({
    example: 'available',
    enum: ['available', 'unavailable', 'disabled'],
  })
  status: 'available' | 'unavailable' | 'disabled';

  @ApiPropertyOptional({ type: DailyInsightResponseDto })
  data?: DailyInsightResponseDto;

  @ApiPropertyOptional({ example: 'AI insight is temporarily unavailable' })
  message?: string;
}

export class DashboardMemeSectionDto {
  @ApiProperty({
    example: 'available',
    enum: ['available', 'unavailable', 'disabled'],
  })
  status: 'available' | 'unavailable' | 'disabled';

  @ApiPropertyOptional({ type: DailyMemeResponseDto })
  data?: DailyMemeResponseDto;

  @ApiPropertyOptional({ example: 'Meme is temporarily unavailable' })
  message?: string;
}

export class DashboardResponseDto {
  @ApiProperty({ type: DashboardUserDto })
  user: DashboardUserDto;

  @ApiProperty({ type: DashboardPreferencesDto })
  preferences: DashboardPreferencesDto;

  @ApiProperty({ type: [DashboardSelectedCoinDto] })
  selectedCoins: DashboardSelectedCoinDto[];

  @ApiProperty({ type: DashboardMarketSectionDto })
  market: DashboardMarketSectionDto;

  @ApiProperty({ type: DashboardNewsSectionDto })
  news: DashboardNewsSectionDto;

  @ApiProperty({ type: DashboardInsightSectionDto })
  insight: DashboardInsightSectionDto;

  @ApiProperty({ type: DashboardMemeSectionDto })
  meme: DashboardMemeSectionDto;

  @ApiProperty({ example: '2026-06-16T10:00:00.000Z' })
  generatedAt: string;
}
