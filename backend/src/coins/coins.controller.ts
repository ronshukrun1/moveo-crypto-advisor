import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CoinsService } from './coins.service';
import { CoinsListResponseDto } from './dto/coin-response.dto';

@ApiTags('coins')
@Controller('coins')
export class CoinsController {
  constructor(private readonly coinsService: CoinsService) {}

  @Get()
  @ApiOperation({
    summary: 'List supported active cryptocurrencies',
    description:
      'Returns the internal catalog of active coins for registration and onboarding flows.',
  })
  @ApiOkResponse({
    description: 'Active supported coins sorted alphabetically by name',
    type: CoinsListResponseDto,
  })
  getActiveCoins(): Promise<CoinsListResponseDto> {
    return this.coinsService.getActiveCoinsResponse();
  }
}
