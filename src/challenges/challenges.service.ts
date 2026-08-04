import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ChallengeStatus, GeneratedBy } from '../common/enums';
import { generateUniqueCodes, isValidDateString } from '../common/utils';
import { Challenge, ChallengeDocument } from '../schemas/challenge.schema';
import { SettingsService } from '../settings/settings.service';
import { ShopsService } from '../shops/shops.service';

export interface GenerateChallengeOptions {
  codeCount?: number;
  codeLength?: number;
  generatedBy?: GeneratedBy;
  force?: boolean;
  shopId?: Types.ObjectId | string;
}

@Injectable()
export class ChallengesService {
  constructor(
    @InjectModel(Challenge.name)
    private readonly challengeModel: Model<ChallengeDocument>,
    private readonly settingsService: SettingsService,
    private readonly shopsService: ShopsService,
  ) {}

  async resolveShopId(
    shopId?: Types.ObjectId | string,
  ): Promise<Types.ObjectId> {
    if (shopId) {
      return typeof shopId === 'string'
        ? new Types.ObjectId(shopId)
        : shopId;
    }

    return this.shopsService.getDefaultShopId();
  }

  async findByDate(
    date: string,
    shopId?: Types.ObjectId | string,
  ): Promise<ChallengeDocument | null> {
    if (!isValidDateString(date)) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
    }

    const resolvedShopId = await this.resolveShopId(shopId);

    return this.challengeModel
      .findOne({ date, shopId: resolvedShopId })
      .exec();
  }

  async findById(challengeId: string): Promise<ChallengeDocument> {
    const challenge = await this.challengeModel.findById(challengeId).exec();

    if (!challenge) {
      throw new NotFoundException('Batch not found');
    }

    return challenge;
  }

  async ensureChallengeForDate(
    date: string,
    shopId?: Types.ObjectId | string,
  ): Promise<ChallengeDocument> {
    const resolvedShopId = await this.resolveShopId(shopId);
    const existing = await this.findByDate(date, resolvedShopId);

    if (existing) {
      return existing;
    }

    return this.generateChallenge(date, {
      generatedBy: GeneratedBy.SYSTEM,
      shopId: resolvedShopId,
    });
  }

  async ensureChallengesForActiveShops(date: string): Promise<{
    created: number;
    total: number;
  }> {
    const shops = await this.shopsService.findActiveShops();
    let created = 0;

    if (!shops.length) {
      const before = await this.findByDate(date);
      await this.ensureChallengeForDate(date);
      return { created: before ? 0 : 1, total: 1 };
    }

    for (const shop of shops) {
      const before = await this.findByDate(date, shop._id);
      await this.ensureChallengeForDate(date, shop._id);
      if (!before) {
        created += 1;
      }
    }

    return { created, total: shops.length };
  }

  async generateChallenge(
    date: string,
    options: GenerateChallengeOptions = {},
  ): Promise<ChallengeDocument> {
    if (!isValidDateString(date)) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
    }

    const shopId = await this.resolveShopId(options.shopId);
    const existing = await this.findByDate(date, shopId);

    if (existing && !options.force) {
      throw new ConflictException(
        `Daily batch for ${date} already exists for this shop`,
      );
    }

    const settings = await this.settingsService.getSettingsForDate(date);
    const codeLength = options.codeLength ?? settings.codeLength;
    const codeCount =
      options.codeCount ?? this.settingsService.resolveCodeCount(settings);
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
      shopId,
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
      throw new BadRequestException('Cannot regenerate a locked batch');
    }

    return this.generateChallenge(challenge.date, {
      codeCount: challenge.totalCodes,
      codeLength: challenge.codeLength,
      generatedBy: GeneratedBy.ADMIN,
      force: true,
      shopId: challenge.shopId,
    });
  }

  async lockChallenge(challengeId: string): Promise<ChallengeDocument> {
    const challenge = await this.findById(challengeId);

    if (challenge.status === ChallengeStatus.LOCKED) {
      throw new BadRequestException('Batch is already locked');
    }

    challenge.status = ChallengeStatus.LOCKED;
    return challenge.save();
  }

  async unlockChallenge(challengeId: string): Promise<ChallengeDocument> {
    const challenge = await this.findById(challengeId);

    if (challenge.status === ChallengeStatus.ACTIVE) {
      throw new BadRequestException('Batch is already unlocked');
    }

    challenge.status = ChallengeStatus.ACTIVE;
    return challenge.save();
  }

  assertChallengeActive(challenge: ChallengeDocument): void {
    if (challenge.status === ChallengeStatus.LOCKED) {
      throw new BadRequestException(
        'Batch is locked. Code upload is temporarily disabled',
      );
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

  toAdminDetail(challenge: ChallengeDocument, shopCode?: string) {
    return {
      id: challenge._id.toString(),
      shopId: challenge.shopId?.toString(),
      shopCode,
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

  async toAdminDetailWithShop(challenge: ChallengeDocument) {
    let shopCode: string | undefined;

    if (challenge.shopId) {
      try {
        const shop = await this.shopsService.findById(
          challenge.shopId.toString(),
        );
        shopCode = shop.shopCode;
      } catch {
        shopCode = undefined;
      }
    }

    return this.toAdminDetail(challenge, shopCode);
  }
}
