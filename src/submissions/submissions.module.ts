import { Module } from '@nestjs/common';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';
import { ChallengesModule } from '../challenges/challenges.module';
import { DatabaseModule } from '../database/database.module';
import { ProcessingJobsModule } from '../processing/processing.module';
import { ShopsModule } from '../shops/shops.module';
import { AdminSubmissionsController } from './admin-submissions.controller';
import { BatchesController } from './batches.controller';
import { SubmissionsService } from './submissions.service';
import { UserChallengesController } from './user-challenges.controller';

@Module({
  imports: [
    DatabaseModule,
    ActivityLogsModule,
    ChallengesModule,
    ShopsModule,
    ProcessingJobsModule,
  ],
  controllers: [
    UserChallengesController,
    BatchesController,
    AdminSubmissionsController,
  ],
  providers: [SubmissionsService],
  exports: [SubmissionsService],
})
export class SubmissionsModule {}
