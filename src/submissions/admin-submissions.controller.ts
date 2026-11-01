import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Locale } from '../common/decorators/locale.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';
import type { ApiLocale } from '../common/utils/i18n.util';
import type { UserDocument } from '../schemas/user.schema';
import { AdminSubmissionListQueryDto } from './dto/admin-submission-list-query.dto';
import { DeleteAnswersDto } from './dto/delete-answers.dto';
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

  @Post(':submissionId/answers/delete')
  @ApiOperation({
    summary: 'Delete one or many entered codes from a user submission',
  })
  deleteAnswers(
    @Param('submissionId') submissionId: string,
    @Body() body: DeleteAnswersDto,
    @CurrentUser() admin: UserDocument,
    @Locale() locale: ApiLocale,
  ) {
    return this.submissionsService.deleteAdminAnswers(
      submissionId,
      body.orders,
      admin,
      locale,
    );
  }

  @Delete(':submissionId/answers/:order')
  @ApiOperation({
    summary: 'Delete one entered code from a user submission',
  })
  deleteAnswer(
    @Param('submissionId') submissionId: string,
    @Param('order', ParseIntPipe) order: number,
    @CurrentUser() admin: UserDocument,
    @Locale() locale: ApiLocale,
  ) {
    return this.submissionsService.deleteAdminAnswer(
      submissionId,
      order,
      admin,
      locale,
    );
  }
}
