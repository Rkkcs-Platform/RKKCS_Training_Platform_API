import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChallengeStatus, GeneratedBy } from '../common/enums';
import { generateUniqueCodes, isValidDateString } from '../common/utils';
import { Challenge, ChallengeDocument } from '../schemas/challenge.schema';
import { SettingsService } from '../settings/settings.service';

export interface GenerateChallengeOptions {
  codeCount?: number;
  codeLength?: number;
  generatedBy?: GeneratedBy;
  force?: boolean;
}

@Injectable()
export class ChallengesService {
  constructor(
    @InjectModel(Challenge.name)
    private readonly challengeModel: Model<ChallengeDocument>,
    private readonly settingsService: SettingsService,
  ) {}

  async findByDate(date: string): Promise<ChallengeDocument | null> {
    if (!isValidDateString(date)) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
    }

    return this.challengeModel.findOne({ date }).exec();
  }

  async findById(challengeId: string): Promise<ChallengeDocument> {
    const challenge = await this.challengeModel.findById(challengeId).exec();

    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    return challenge;
  }

  async ensureChallengeForDate(date: string): Promise<ChallengeDocument> {
    const existing = await this.findByDate(date);

    if (existing) {
      return existing;
    }

    return this.generateChallenge(date, { generatedBy: GeneratedBy.SYSTEM });
  }

  async generateChallenge(
    date: string,
    options: GenerateChallengeOptions = {},
  ): Promise<ChallengeDocument> {
    if (!isValidDateString(date)) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
    }

    const existing = await this.findByDate(date);

    if (existing && !options.force) {
      throw new ConflictException(`Challenge for ${date} already exists`);
    }

    const settings = await this.settingsService.getSettingsForDate(date);
    const codeCount = options.codeCount ?? settings.codeCount;
    const codeLength = options.codeLength ?? settings.codeLength;
    const codes = generateUniqueCodes(codeCount, codeLength);
    const generatedBy = options.generatedBy ?? GeneratedBy.ADMIN;

    if (existing && options.force) {
      existing.codes = codes;
      existing.totalCodes = codeCount;
      existing.codeLength = codeLength;
      existing.generatedAt = new Date();
      existing.generatedBy = generatedBy;
      existing.status = ChallengeStatus.ACTIVE;
      return existing.save();
    }

    return this.challengeModel.create({
      date,
      codes,
      totalCodes: codeCount,
      codeLength,
      generatedAt: new Date(),
      generatedBy,
      status: ChallengeStatus.ACTIVE,
    });
  }

  async regenerateChallenge(challengeId: string): Promise<ChallengeDocument> {
    const challenge = await this.findById(challengeId);

    if (challenge.status === ChallengeStatus.LOCKED) {
      throw new BadRequestException('Cannot regenerate a locked challenge');
    }

    return this.generateChallenge(challenge.date, {
      codeCount: challenge.totalCodes,
      codeLength: challenge.codeLength,
      generatedBy: GeneratedBy.ADMIN,
      force: true,
    });
  }

  assertChallengeActive(challenge: ChallengeDocument): void {
    if (challenge.status === ChallengeStatus.LOCKED) {
      throw new BadRequestException('Challenge is locked');
    }
  }

  matchCode(
    challenge: ChallengeDocument,
    inputCode: string,
  ): { isCorrect: boolean; matchedCode?: string } {
    const matched = challenge.codes.find((item) => item.code === inputCode);

    if (!matched) {
      return { isCorrect: false };
    }

    return {
      isCorrect: true,
      matchedCode: matched.code,
    };
  }

  toAdminDetail(challenge: ChallengeDocument) {
    return {
      id: challenge._id.toString(),
      date: challenge.date,
      totalCodes: challenge.totalCodes,
      codeLength: challenge.codeLength,
      generatedAt: challenge.generatedAt,
      generatedBy: challenge.generatedBy,
      status: challenge.status,
      codes: challenge.codes.map((item) => ({
        order: item.order,
        code: item.code,
      })),
    };
  }
}
