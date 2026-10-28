import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AdminSettingsController } from './admin-settings.controller';
import { MaintenanceCronService } from './maintenance-cron.service';
import { SettingsService } from './settings.service';
import { SettingChallengeController } from './setting-challenge.controller';

@Module({
  imports: [DatabaseModule],
  providers: [SettingsService, MaintenanceCronService],
  controllers: [SettingChallengeController, AdminSettingsController],
  exports: [SettingsService],
})
export class SettingsModule {}
