import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/interfaces/auth.interfaces';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';
import { OnboardingResponseDto } from './dto/onboarding-response.dto';
import { OnboardingService } from './onboarding.service';

@ApiTags('onboarding')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Complete or update onboarding',
    description:
      'Atomically saves content preferences, replaces selected coins, and marks onboarding as completed for the authenticated user.',
  })
  @ApiOkResponse({
    description: 'Onboarding completed successfully',
    type: OnboardingResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      'Invalid request body, duplicate coin IDs, or invalid/inactive coin IDs',
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing token' })
  @ApiNotFoundResponse({ description: 'Authenticated user no longer exists' })
  completeOnboarding(
    @CurrentUser() user: AuthenticatedUser,
    @Body() completeDto: CompleteOnboardingDto,
  ) {
    return this.onboardingService.completeOnboarding(user.id, completeDto);
  }
}
