import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBadGatewayResponse,
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiGatewayTimeoutResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/interfaces/auth.interfaces';
import { GetNewsQueryDto } from './dto/get-news-query.dto';
import { NewsListResponseDto } from './dto/news-response.dto';
import { NewsService } from './news.service';

@ApiTags('news')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get()
  @ApiOperation({
    summary:
      'Get cryptocurrency news for the authenticated user selected coins',
    description:
      'Returns NewsData articles related to the authenticated user active selected coins. Does not call the provider when no coins are selected.',
  })
  @ApiOkResponse({
    description: 'News articles related to selected active coins',
    type: NewsListResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid query parameters or unknown fields',
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing token' })
  @ApiNotFoundResponse({ description: 'Authenticated user no longer exists' })
  @ApiBadGatewayResponse({
    description: 'News provider authentication or upstream failure',
  })
  @ApiServiceUnavailableResponse({
    description: 'News provider rate limit reached',
  })
  @ApiGatewayTimeoutResponse({ description: 'News provider request timed out' })
  getNews(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: GetNewsQueryDto,
  ) {
    return this.newsService.getNews(user.id, query);
  }
}
