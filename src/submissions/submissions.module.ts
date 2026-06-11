import { Module } from '@nestjs/common';
import { ChallengesModule } from '../challenges/challenges.module';
import { DatabaseModule } from '../database/database.module';
import { AdminSubmissionsController } from './admin-submissions.controller';
import { SubmissionsService } from './submissions.service';
import { UserChallengesController } from './user-challenges.controller';

@Module({
  imports: [DatabaseModule, ChallengesModule],
  controllers: [UserChallengesController, AdminSubmissionsController],
  providers: [SubmissionsService],
  exports: [SubmissionsService],
})
export class SubmissionsModule {}
