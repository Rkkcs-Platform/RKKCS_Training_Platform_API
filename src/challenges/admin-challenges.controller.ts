import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import {
  ACTIVITY_ACTION,
} from '../common/constants/activity-action.constant';
import { ACTIVITY_TARGET } from '../common/constants/activity-target.constant';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';
import type { UserDocument } from '../schemas/user.schema';
import { ChallengeExportService } from './challenge-export.service';
import { ChallengesService } from './challenges.service';
import { GenerateChallengeDto } from './dto/generate-challenge.dto';

@ApiTags('Admin - Challenges')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin/challenges')
export class AdminChallengesController {
  constructor(
    private readonly challengesService: ChallengesService,
    private readonly challengeExportService: ChallengeExportService,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate challenge for a specific date' })
  async generate(
    @CurrentUser() admin: UserDocument,
    @Body() dto: GenerateChallengeDto,
  ) {
    const challenge = await this.challengesService.generateChallenge(dto.date, {
      codeCount: dto.codeCount,
      codeLength: dto.codeLength,
    });

    this.activityLogsService.recordFromUser(admin, {
      action: ACTIVITY_ACTION.CHALLENGE_GENERATE,
      targetType: ACTIVITY_TARGET.CHALLENGE,
      targetId: challenge._id,
      metadata: {
        date: challenge.date,
        totalCodes: challenge.totalCodes,
        codeLength: challenge.codeLength,
      },
    });

    return this.challengesService.toAdminDetail(challenge);
  }

  @Get('date/:date/codes/export')
  @ApiOperation({ summary: 'Export challenge codes CSV by date' })
  @ApiProduces('text/csv')
  exportByDate(
    @CurrentUser() admin: UserDocument,
    @Param('date') date: string,
  ) {
    this.activityLogsService.recordFromUser(admin, {
      action: ACTIVITY_ACTION.CHALLENGE_EXPORT,
      targetType: ACTIVITY_TARGET.CHALLENGE,
      metadata: { date, exportBy: 'date' },
    });

    return this.challengeExportService.exportByDate(date);
  }

  @Get('date/:date')
  @ApiOperation({ summary: 'Get challenge by date' })
  async getByDate(@Param('date') date: string) {
    const challenge = await this.challengesService.findByDate(date);

    if (!challenge) {
      return { date, exists: false };
    }

    return this.challengesService.toAdminDetail(challenge);
  }

  @Get(':challengeId/codes/export')
  @ApiOperation({ summary: 'Export challenge codes CSV by challenge ID' })
  @ApiProduces('text/csv')
  exportByChallengeId(
    @CurrentUser() admin: UserDocument,
    @Param('challengeId') challengeId: string,
  ) {
    this.activityLogsService.recordFromUser(admin, {
      action: ACTIVITY_ACTION.CHALLENGE_EXPORT,
      targetType: ACTIVITY_TARGET.CHALLENGE,
      targetId: challengeId,
      metadata: { exportBy: 'challengeId' },
    });

    return this.challengeExportService.exportByChallengeId(challengeId);
  }

  @Get(':challengeId')
  @ApiOperation({ summary: 'Get challenge detail' })
  async getById(@Param('challengeId') challengeId: string) {
    const challenge = await this.challengesService.findById(challengeId);
    return this.challengesService.toAdminDetail(challenge);
  }

  @Post(':challengeId/regenerate')
  @ApiOperation({ summary: 'Regenerate challenge codes' })
  async regenerate(
    @CurrentUser() admin: UserDocument,
    @Param('challengeId') challengeId: string,
  ) {
    const challenge =
      await this.challengesService.regenerateChallenge(challengeId);

    this.activityLogsService.recordFromUser(admin, {
      action: ACTIVITY_ACTION.CHALLENGE_REGENERATE,
      targetType: ACTIVITY_TARGET.CHALLENGE,
      targetId: challenge._id,
      metadata: {
        date: challenge.date,
        totalCodes: challenge.totalCodes,
      },
    });

    return this.challengesService.toAdminDetail(challenge);
  }
}
