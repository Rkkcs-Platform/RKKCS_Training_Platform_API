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
      const result =
        await this.challengesService.ensureChallengesForActiveShops(date);

      this.activityLogsService.record({
        action: ACTIVITY_ACTION.CHALLENGE_DAILY_CRON,
        actorRole: ActorRole.SYSTEM,
        targetType: ACTIVITY_TARGET.CHALLENGE,
        metadata: {
          date,
          shopsProcessed: result.total,
          created: result.created,
        },
      });

      this.logger.log(
        `Daily batches ready for ${date}: ${result.total} shops (${result.created} created)`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown cron error';
      this.logger.error(`Failed to generate challenges for ${date}: ${message}`);
    }
  }
}
