import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/interfaces/auth.interfaces';
import { DashboardService } from './dashboard.service';
import { DashboardResponseDto } from './dto/dashboard-response.dto';
import { DashboardQueryDto } from './dto/dashboard-query.dto';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({
    summary: 'Get the authenticated user personalized dashboard',
    description:
      'Orchestrates user info, preferences, selected coins, and enabled content sections. Shared market and news data are reused within a single request when generating insight and meme content. Optional sections may return unavailable without failing the entire dashboard.',
  })
  @ApiOkResponse({
    description:
      'Dashboard response with available, unavailable, or disabled content sections',
    type: DashboardResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing token' })
  @ApiNotFoundResponse({ description: 'Authenticated user no longer exists' })
  @ApiConflictResponse({
    description: 'Onboarding has not been completed',
  })
  @ApiInternalServerErrorResponse({
    description: 'Unexpected dashboard orchestration failure',
  })
  getDashboard(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: DashboardQueryDto,
  ) {
    void query;
    return this.dashboardService.getDashboard(user.id);
  }
}
