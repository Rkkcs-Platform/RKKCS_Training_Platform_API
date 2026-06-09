import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';
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
  ) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate challenge for a specific date' })
  generate(@Body() dto: GenerateChallengeDto) {
    return this.challengesService
      .generateChallenge(dto.date, {
        codeCount: dto.codeCount,
        codeLength: dto.codeLength,
      })
      .then((challenge) => this.challengesService.toAdminDetail(challenge));
  }

  @Get('date/:date/codes/export')
  @ApiOperation({ summary: 'Export challenge codes CSV by date' })
  @ApiProduces('text/csv')
  exportByDate(@Param('date') date: string) {
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
  exportByChallengeId(@Param('challengeId') challengeId: string) {
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
  async regenerate(@Param('challengeId') challengeId: string) {
    const challenge =
      await this.challengesService.regenerateChallenge(challengeId);
    return this.challengesService.toAdminDetail(challenge);
  }
}
