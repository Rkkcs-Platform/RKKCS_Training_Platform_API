import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Locale } from '../common/decorators/locale.decorator';
import { SubmissionHistoryQueryDto } from '../common/dto/pagination-query.dto';
import type { ApiLocale } from '../common/utils/i18n.util';
import type { UserDocument } from '../schemas/user.schema';
import { SubmitCodeDto } from './dto/submit-code.dto';
import { SubmissionsService } from './submissions.service';

@ApiTags('User - Challenges')
@ApiBearerAuth()
@Controller('user')
export class UserChallengesController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Get('challenges/today')
  @ApiOperation({ summary: 'Get today challenge progress' })
  getTodayChallenge(@CurrentUser() user: UserDocument) {
    return this.submissionsService.getTodayChallenge(user);
  }

  @Post('challenges/today/submit')
  @ApiOperation({ summary: 'Submit a code for today challenge' })
  submitTodayCode(
    @CurrentUser() user: UserDocument,
    @Body() dto: SubmitCodeDto,
    @Locale() locale: ApiLocale,
  ) {
    return this.submissionsService.submitTodayCode(user, dto.code, locale);
  }

  @Get('challenges/today/result')
  @ApiOperation({ summary: 'Get today challenge result' })
  getTodayResult(
    @CurrentUser() user: UserDocument,
    @Locale() locale: ApiLocale,
  ) {
    return this.submissionsService.getTodayResult(user, locale);
  }

  @Get('submissions')
  @ApiOperation({ summary: 'Get submission history' })
  getHistory(
    @CurrentUser() user: UserDocument,
    @Query() query: SubmissionHistoryQueryDto,
  ) {
    return this.submissionsService.getHistory(user, query);
  }

  @Get('submissions/:date')
  @ApiOperation({ summary: 'Get submission detail by date' })
  getSubmissionByDate(
    @CurrentUser() user: UserDocument,
    @Param('date') date: string,
    @Locale() locale: ApiLocale,
  ) {
    return this.submissionsService.getSubmissionByDate(user, date, locale);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get personal statistics' })
  getStatistics(@CurrentUser() user: UserDocument) {
    return this.submissionsService.getStatistics(user);
  }
}
