import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
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
      shopId: dto.shopId,
    });

    this.activityLogsService.recordFromUser(admin, {
      action: ACTIVITY_ACTION.CHALLENGE_GENERATE,
      targetType: ACTIVITY_TARGET.CHALLENGE,
      targetId: challenge._id,
      metadata: {
        date: challenge.date,
        shopId: challenge.shopId?.toString(),
        totalCodes: challenge.totalCodes,
        codeLength: challenge.codeLength,
      },
    });

    return this.challengesService.toAdminDetailWithShop(challenge);
  }

  @Get('date/:date/codes/export')
  @ApiOperation({ summary: 'Export challenge codes CSV by date' })
  @ApiProduces('text/csv')
  exportByDate(
    @CurrentUser() admin: UserDocument,
    @Param('date') date: string,
    @Query('shopId') shopId?: string,
  ) {
    this.activityLogsService.recordFromUser(admin, {
      action: ACTIVITY_ACTION.CHALLENGE_EXPORT,
      targetType: ACTIVITY_TARGET.CHALLENGE,
      metadata: { date, shopId, exportBy: 'date' },
    });

    return this.challengeExportService.exportByDate(date, shopId);
  }

  @Get('date/:date')
  @ApiOperation({ summary: 'Get challenge by date (pass shopId for multi-shop)' })
  async getByDate(
    @Param('date') date: string,
    @Query('shopId') shopId?: string,
  ) {
    const challenge = await this.challengesService.findByDate(date, shopId);

    if (!challenge) {
      return { date, shopId, exists: false };
    }

    return this.challengesService.toAdminDetailWithShop(challenge);
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
    return this.challengesService.toAdminDetailWithShop(challenge);
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

    return this.challengesService.toAdminDetailWithShop(challenge);
  }

  @Post(':challengeId/lock')
  @ApiOperation({ summary: 'Lock daily batch — users cannot upload codes' })
  async lock(
    @CurrentUser() admin: UserDocument,
    @Param('challengeId') challengeId: string,
  ) {
    const challenge = await this.challengesService.lockChallenge(challengeId);

    this.activityLogsService.recordFromUser(admin, {
      action: ACTIVITY_ACTION.CHALLENGE_LOCK,
      targetType: ACTIVITY_TARGET.CHALLENGE,
      targetId: challenge._id,
      metadata: { date: challenge.date },
    });

    return this.challengesService.toAdminDetailWithShop(challenge);
  }

  @Post(':challengeId/unlock')
  @ApiOperation({ summary: 'Unlock daily batch — users can upload codes again' })
  async unlock(
    @CurrentUser() admin: UserDocument,
    @Param('challengeId') challengeId: string,
  ) {
    const challenge = await this.challengesService.unlockChallenge(challengeId);

    this.activityLogsService.recordFromUser(admin, {
      action: ACTIVITY_ACTION.CHALLENGE_UNLOCK,
      targetType: ACTIVITY_TARGET.CHALLENGE,
      targetId: challenge._id,
      metadata: { date: challenge.date },
    });

    return this.challengesService.toAdminDetailWithShop(challenge);
  }
}
