import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBadGatewayResponse,
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiGatewayTimeoutResponse,
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/interfaces/auth.interfaces';
import { DailyInsightResponseDto } from './dto/daily-insight-response.dto';
import { InsightsService } from './insights.service';

@ApiTags('insights')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('insights')
export class InsightsController {
  constructor(private readonly insightsService: InsightsService) {}

  @Get('daily')
  @ApiOperation({
    summary: 'Get a personalized daily crypto insight',
    description:
      'Returns a short educational insight for the authenticated user based on their investor profile, selected coins, current market data, and recent news. This is not financial advice.',
  })
  @ApiOkResponse({
    description: 'Educational daily insight generated from supplied facts',
    type: DailyInsightResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'User has no selected coins',
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing token' })
  @ApiBadGatewayResponse({
    description:
      'OpenRouter authentication, malformed response, or upstream failure',
  })
  @ApiServiceUnavailableResponse({
    description: 'OpenRouter rate limit reached',
  })
  @ApiGatewayTimeoutResponse({
    description: 'OpenRouter request timed out',
  })
  getDailyInsight(@CurrentUser() user: AuthenticatedUser) {
    return this.insightsService.getDailyInsight(user.id);
  }
}
