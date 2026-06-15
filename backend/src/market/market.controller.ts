import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBadGatewayResponse,
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
import { MarketListResponseDto } from './dto/market-response.dto';
import { MarketService } from './market.service';

@ApiTags('market')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('market')
export class MarketController {
  constructor(private readonly marketService: MarketService) {}

  @Get()
  @ApiOperation({
    summary: 'Get live market data for the authenticated user selected coins',
    description:
      'Returns CoinGecko market data for the authenticated user active selected coins. Does not call the provider when no coins are selected.',
  })
  @ApiOkResponse({
    description:
      'Market data for selected active coins sorted alphabetically by name',
    type: MarketListResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing token' })
  @ApiNotFoundResponse({ description: 'Authenticated user no longer exists' })
  @ApiBadGatewayResponse({
    description: 'Market data provider authentication or upstream failure',
  })
  @ApiServiceUnavailableResponse({
    description: 'Market data provider rate limit reached',
  })
  @ApiGatewayTimeoutResponse({
    description: 'Market data provider request timed out',
  })
  getMarketData(@CurrentUser() user: AuthenticatedUser) {
    return this.marketService.getMarketData(user.id);
  }
}
