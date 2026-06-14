import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ActivityLogsService } from './activity-logs.service';
import { AdminActivityLogsController } from './admin-activity-logs.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [AdminActivityLogsController],
  providers: [ActivityLogsService],
  exports: [ActivityLogsService],
})
export class ActivityLogsModule {}
