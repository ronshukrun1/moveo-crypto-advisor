import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
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
import { ReplaceSelectedCoinsDto } from './dto/replace-selected-coins.dto';
import {
  ReplaceSelectedCoinsResponseDto,
  SelectedCoinsListResponseDto,
} from './dto/selected-coins-response.dto';
import { SelectedCoinsService } from './selected-coins.service';

@ApiTags('selected-coins')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('selected-coins')
export class SelectedCoinsController {
  constructor(private readonly selectedCoinsService: SelectedCoinsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get the authenticated user selected active coins',
  })
  @ApiOkResponse({
    description: 'Selected active coins sorted alphabetically by name',
    type: SelectedCoinsListResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing token' })
  @ApiNotFoundResponse({ description: 'Authenticated user no longer exists' })
  getSelectedCoins(@CurrentUser() user: AuthenticatedUser) {
    return this.selectedCoinsService.getSelectedCoins(user.id);
  }

  @Put()
  @ApiOperation({
    summary: 'Replace the authenticated user selected coins',
    description:
      'Replaces the full selected-coin list atomically. An empty coinIds array clears all selections.',
  })
  @ApiOkResponse({
    description: 'Selected coins updated successfully',
    type: ReplaceSelectedCoinsResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      'Invalid request body, duplicate IDs, or invalid/inactive coin IDs',
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing token' })
  @ApiNotFoundResponse({ description: 'Authenticated user no longer exists' })
  replaceSelectedCoins(
    @CurrentUser() user: AuthenticatedUser,
    @Body() replaceDto: ReplaceSelectedCoinsDto,
  ) {
    return this.selectedCoinsService.replaceSelectedCoins(user.id, replaceDto);
  }
}
