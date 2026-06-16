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
import { DailyMemeResponseDto } from './dto/daily-meme-response.dto';
import { MemesService } from './memes.service';

@ApiTags('memes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('memes')
export class MemesController {
  constructor(private readonly memesService: MemesService) {}

  @Get('daily')
  @ApiOperation({
    summary: 'Get the authenticated user personalized daily meme',
    description:
      'Returns the persisted meme for the authenticated user and current UTC calendar date. Same-day requests reuse stored content without calling Imgflip again.',
  })
  @ApiOkResponse({
    description: 'Generated meme mapped to the internal response shape',
    type: DailyMemeResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'User has no selected coins',
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing token' })
  @ApiBadGatewayResponse({
    description:
      'Imgflip authentication, template, malformed response, or upstream failure',
  })
  @ApiServiceUnavailableResponse({
    description: 'Imgflip rate limit or temporary upstream unavailability',
  })
  @ApiGatewayTimeoutResponse({
    description: 'Imgflip request timed out',
  })
  getDailyMeme(@CurrentUser() user: AuthenticatedUser) {
    return this.memesService.getDailyMeme(user.id);
  }
}
