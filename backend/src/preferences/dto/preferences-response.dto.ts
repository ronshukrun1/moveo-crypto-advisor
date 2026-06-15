import { ApiProperty } from '@nestjs/swagger';
import { InvestorProfile } from '../enums/investor-profile.enum';

export class PreferencesResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ enum: InvestorProfile, example: InvestorProfile.BEGINNER })
  investorProfile: InvestorProfile;

  @ApiProperty({ example: true })
  showMarketPrices: boolean;

  @ApiProperty({ example: true })
  showNews: boolean;

  @ApiProperty({ example: true })
  showAiInsight: boolean;

  @ApiProperty({ example: true })
  showMeme: boolean;

  @ApiProperty({ example: '2026-06-15T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-06-15T12:00:00.000Z' })
  updatedAt: Date;
}

export class UpdatePreferencesResponseDto {
  @ApiProperty({ example: 'Preferences updated successfully' })
  message: string;

  @ApiProperty({ type: PreferencesResponseDto })
  preferences: PreferencesResponseDto;
}
