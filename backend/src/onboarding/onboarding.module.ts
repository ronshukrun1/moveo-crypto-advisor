import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PreferencesModule } from '../preferences/preferences.module';
import { SelectedCoinsModule } from '../selected-coins/selected-coins.module';
import { UsersModule } from '../users/users.module';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';

@Module({
  imports: [UsersModule, PreferencesModule, SelectedCoinsModule, AuthModule],
  controllers: [OnboardingController],
  providers: [OnboardingService],
})
export class OnboardingModule {}
