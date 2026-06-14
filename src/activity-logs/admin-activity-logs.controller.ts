import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';
import { ActivityLogsService } from './activity-logs.service';
import { ActivityLogQueryDto } from './dto/activity-log-query.dto';

@ApiTags('Admin - Activity Logs')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin/activity-logs')
export class AdminActivityLogsController {
  constructor(private readonly activityLogsService: ActivityLogsService) {}

  @Get()
  @ApiOperation({ summary: 'List activity logs' })
  list(@Query() query: ActivityLogQueryDto) {
    return this.activityLogsService.findAll(query);
  }
}
