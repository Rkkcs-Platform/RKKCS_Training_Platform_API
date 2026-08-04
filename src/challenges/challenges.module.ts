import { Module } from '@nestjs/common';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';
import { DatabaseModule } from '../database/database.module';
import { SettingsModule } from '../settings/settings.module';
import { ShopsModule } from '../shops/shops.module';
import { AdminChallengesController } from './admin-challenges.controller';
import { ChallengeExportService } from './challenge-export.service';
import { ChallengesCronService } from './challenges-cron.service';
import { ChallengesService } from './challenges.service';

@Module({
  imports: [DatabaseModule, ActivityLogsModule, SettingsModule, ShopsModule],
  controllers: [AdminChallengesController],
  providers: [ChallengesService, ChallengesCronService, ChallengeExportService],
  exports: [ChallengesService],
})
export class ChallengesModule {}
