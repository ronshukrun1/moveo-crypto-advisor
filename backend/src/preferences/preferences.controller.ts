import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
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
import {
  PreferencesResponseDto,
  UpdatePreferencesResponseDto,
} from './dto/preferences-response.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { PreferencesService } from './preferences.service';

@ApiTags('preferences')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('preferences')
export class PreferencesController {
  constructor(private readonly preferencesService: PreferencesService) {}

  @Get()
  @ApiOperation({ summary: 'Get the authenticated user content preferences' })
  @ApiOkResponse({
    description: 'Current user preferences',
    type: PreferencesResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing token' })
  @ApiNotFoundResponse({ description: 'Authenticated user no longer exists' })
  getPreferences(@CurrentUser() user: AuthenticatedUser) {
    return this.preferencesService.getPreferences(user.id);
  }

  @Patch()
  @ApiOperation({
    summary: 'Update the authenticated user content preferences',
  })
  @ApiOkResponse({
    description: 'Preferences updated successfully',
    type: UpdatePreferencesResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid or empty update body',
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing token' })
  @ApiNotFoundResponse({ description: 'Authenticated user no longer exists' })
  updatePreferences(
    @CurrentUser() user: AuthenticatedUser,
    @Body() updateDto: UpdatePreferencesDto,
  ) {
    return this.preferencesService.updatePreferences(user.id, updateDto);
  }
}
