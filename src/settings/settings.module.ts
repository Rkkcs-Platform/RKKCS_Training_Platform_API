import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AdminSettingsController } from './admin-settings.controller';
import { SettingsService } from './settings.service';
import { SettingChallengeController } from './setting-challenge.controller';

@Module({
  imports: [DatabaseModule],
  providers: [SettingsService],
  controllers: [SettingChallengeController, AdminSettingsController],
  exports: [SettingsService],
})
export class SettingsModule {}
