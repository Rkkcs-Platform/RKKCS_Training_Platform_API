import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Locale } from '../common/decorators/locale.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';
import type { ApiLocale } from '../common/utils/i18n.util';
import { AdminSubmissionListQueryDto } from './dto/admin-submission-list-query.dto';
import { SubmissionsService } from './submissions.service';

@ApiTags('Admin - Submissions')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin/submissions')
export class AdminSubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Get()
  @ApiOperation({ summary: 'List all user submissions' })
  list(
    @Query() query: AdminSubmissionListQueryDto,
    @Locale() locale: ApiLocale,
  ) {
    return this.submissionsService.getAdminSubmissions(query, locale);
  }

  @Get(':submissionId')
  @ApiOperation({ summary: 'Get submission detail by ID' })
  getById(
    @Param('submissionId') submissionId: string,
    @Locale() locale: ApiLocale,
  ) {
    return this.submissionsService.getAdminSubmissionById(submissionId, locale);
  }
}
