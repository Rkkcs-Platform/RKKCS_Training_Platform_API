import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { SettingsModule } from '../settings/settings.module';
import { AdminChallengesController } from './admin-challenges.controller';
import { ChallengeExportService } from './challenge-export.service';
import { ChallengesCronService } from './challenges-cron.service';
import { ChallengesService } from './challenges.service';

@Module({
  imports: [DatabaseModule, SettingsModule],
  controllers: [AdminChallengesController],
  providers: [ChallengesService, ChallengesCronService, ChallengeExportService],
  exports: [ChallengesService],
})
export class ChallengesModule {}
