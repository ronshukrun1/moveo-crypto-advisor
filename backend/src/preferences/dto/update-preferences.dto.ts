import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { InvestorProfile } from '../enums/investor-profile.enum';

export class UpdatePreferencesDto {
  @ApiPropertyOptional({ enum: InvestorProfile })
  @IsOptional()
  @IsEnum(InvestorProfile)
  investorProfile?: InvestorProfile;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  showMarketPrices?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  showNews?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  showAiInsight?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  showMeme?: boolean;
}
