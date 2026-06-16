import { Body, Controller, Get, Put, Query, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/auth.interfaces';
import { GetFeedbackQueryDto } from './dto/get-feedback-query.dto';
import {
  FeedbackListResponseDto,
  FeedbackResponseDto,
} from './dto/feedback-response.dto';
import { UpsertFeedbackDto } from './dto/upsert-feedback.dto';
import { FeedbackService } from './feedback.service';

@ApiTags('feedback')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Put()
  @ApiOperation({ summary: 'Create or update feedback for dashboard content' })
  @ApiOkResponse({ type: FeedbackResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid feedback payload' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing token' })
  @ApiNotFoundResponse({ description: 'Content target not found' })
  upsertFeedback(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpsertFeedbackDto,
  ) {
    return this.feedbackService.upsertFeedback(user.id, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get existing feedback for dashboard content targets',
  })
  @ApiOkResponse({ type: FeedbackListResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing token' })
  getFeedback(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: GetFeedbackQueryDto,
  ) {
    return this.feedbackService.getFeedback(user.id, query.contentIds ?? []);
  }
}
