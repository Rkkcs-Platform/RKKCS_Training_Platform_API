import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { APP_TIMEZONE } from '../common/constants/app.constant';
import { getTodayDate } from '../common/utils';
import { ChallengesService } from './challenges.service';

@Injectable()
export class ChallengesCronService {
  private readonly logger = new Logger(ChallengesCronService.name);

  constructor(private readonly challengesService: ChallengesService) {}

  @Cron('0 3 * * *', { timeZone: APP_TIMEZONE })
  async generateDailyChallenge() {
    const date = getTodayDate();

    try {
      const challenge =
        await this.challengesService.ensureChallengeForDate(date);
      this.logger.log(
        `Daily challenge ready for ${date} (${challenge.totalCodes} codes)`,
      );
      console.log(
        `Daily challenge ready for ${date} (${challenge.totalCodes} codes)`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown cron error';
      this.logger.error(`Failed to generate challenge for ${date}: ${message}`);
    }
  }
}
