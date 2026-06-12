import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { APP_TIMEZONE } from '../common/constants/app.constant';
import {
  ACTIVITY_ACTION,
} from '../common/constants/activity-action.constant';
import { ACTIVITY_TARGET } from '../common/constants/activity-target.constant';
import { ActorRole } from '../common/enums';
import { getTodayDate } from '../common/utils';
import { ChallengesService } from './challenges.service';

@Injectable()
export class ChallengesCronService {
  private readonly logger = new Logger(ChallengesCronService.name);

  constructor(
    private readonly challengesService: ChallengesService,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  @Cron('0 3 * * *', { timeZone: APP_TIMEZONE })
  async generateDailyChallenge() {
    const date = getTodayDate();

    try {
      const existing = await this.challengesService.findByDate(date);
      const challenge =
        await this.challengesService.ensureChallengeForDate(date);

      this.activityLogsService.record({
        action: ACTIVITY_ACTION.CHALLENGE_DAILY_CRON,
        actorRole: ActorRole.SYSTEM,
        targetType: ACTIVITY_TARGET.CHALLENGE,
        targetId: challenge._id,
        metadata: {
          date,
          totalCodes: challenge.totalCodes,
          created: !existing,
        },
      });

      this.logger.log(
        `Daily challenge ready for ${date} (${challenge.totalCodes} codes)`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown cron error';
      this.logger.error(`Failed to generate challenge for ${date}: ${message}`);
    }
  }
}
