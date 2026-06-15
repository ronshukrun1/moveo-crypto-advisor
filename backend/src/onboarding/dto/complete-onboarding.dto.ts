import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsPositive,
} from 'class-validator';
import { InvestorProfile } from '../../preferences/enums/investor-profile.enum';

export class CompleteOnboardingDto {
  @ApiProperty({
    enum: InvestorProfile,
    example: InvestorProfile.LONG_TERM_HOLDER,
  })
  @IsEnum(InvestorProfile)
  investorProfile: InvestorProfile;

  @ApiProperty({ example: true })
  @IsBoolean()
  showMarketPrices: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  showNews: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  showAiInsight: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  showMeme: boolean;

  @ApiProperty({
    type: [Number],
    example: [1, 2, 3],
    description: 'At least one active coin ID is required',
  })
  @IsArray()
  @ArrayNotEmpty({ message: 'At least one coin must be selected' })
  @IsInt({ each: true })
  @IsPositive({ each: true })
  @ArrayUnique({ message: 'Duplicate coin IDs are not allowed' })
  coinIds: number[];
}
