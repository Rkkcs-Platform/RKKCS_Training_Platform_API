import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SubmissionHistoryQueryDto } from '../common/dto/pagination-query.dto';
import type { UserDocument } from '../schemas/user.schema';
import { SubmitCodeDto } from './dto/submit-code.dto';
import { SubmissionsService } from './submissions.service';

@ApiTags('Batches')
@ApiBearerAuth()
@Controller('batches')
export class BatchesController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Get('today')
  @ApiOperation({ summary: 'Get today batch progress (alias)' })
  getTodayChallenge(@CurrentUser() user: UserDocument) {
    return this.submissionsService.getTodayChallenge(user);
  }

  @Post('upload-code')
  @ApiOperation({ summary: 'Upload a transaction code for today (alias)' })
  submitTodayCode(
    @CurrentUser() user: UserDocument,
    @Body() dto: SubmitCodeDto,
  ) {
    return this.submissionsService.submitTodayCode(user, dto.code);
  }

  @Get('today/result')
  @ApiOperation({ summary: 'Get today batch result (alias)' })
  getTodayResult(@CurrentUser() user: UserDocument) {
    return this.submissionsService.getTodayResult(user);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get batch history (alias)' })
  getHistory(
    @CurrentUser() user: UserDocument,
    @Query() query: SubmissionHistoryQueryDto,
  ) {
    return this.submissionsService.getHistory(user, query);
  }

  @Get('history/:date')
  @ApiOperation({ summary: 'Get batch detail by date (alias)' })
  getSubmissionByDate(
    @CurrentUser() user: UserDocument,
    @Param('date') date: string,
  ) {
    return this.submissionsService.getSubmissionByDate(user, date);
  }
}
