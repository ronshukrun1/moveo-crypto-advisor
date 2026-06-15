import { ApiProperty } from '@nestjs/swagger';
import { CoinItemDto } from '../../coins/dto/coin-response.dto';
import { InvestorProfile } from '../../preferences/enums/investor-profile.enum';

export class OnboardingPreferencesDto {
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

export class OnboardingResponseDto {
  @ApiProperty({ example: 'Onboarding completed successfully' })
  message: string;

  @ApiProperty({ example: true })
  onboardingCompleted: boolean;

  @ApiProperty({ type: OnboardingPreferencesDto })
  preferences: OnboardingPreferencesDto;

  @ApiProperty({ type: [CoinItemDto] })
  selectedCoins: CoinItemDto[];
}
