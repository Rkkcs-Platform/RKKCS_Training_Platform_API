import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { APP_TIMEZONE } from '../common/constants/app.constant';
import { SettingsService } from './settings.service';

@Injectable()
export class MaintenanceCronService {
  private readonly logger = new Logger(MaintenanceCronService.name);

  constructor(private readonly settingsService: SettingsService) {}

  @Cron('* * * * *', { timeZone: APP_TIMEZONE })
  async clearExpiredMaintenance() {
    const cleared = await this.settingsService.clearExpiredMaintenance();
    if (cleared) {
      this.logger.log('Maintenance mode ended automatically (until time reached)');
    }
  }
}
