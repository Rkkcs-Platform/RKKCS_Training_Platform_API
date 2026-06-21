import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomInt } from 'crypto';
import { Model } from 'mongoose';
import {
  AUTO_RANDOM_CODE_COUNT_MAX,
  AUTO_RANDOM_CODE_COUNT_MIN,
} from '../common/constants/app.constant';
import {
  ChallengeSetting,
  ChallengeSettingDocument,
} from '../schemas/challenge-setting.schema';
export interface ChallengeGenerationSettings {
  codeCount: number;
  codeLength: number;
  isAutoRandomCodeCount: boolean;
  generateTime: string;
}

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel(ChallengeSetting.name)
    private readonly challengeSettingModel: Model<ChallengeSettingDocument>,
  ) {}

  async getSettingsForDate(date: string): Promise<ChallengeGenerationSettings> {
    const dailySetting = await this.challengeSettingModel
      .findOne({ date, isDefault: false })
      .exec();

    if (dailySetting) {
      return {
        codeCount: dailySetting.codeCount,
        codeLength: dailySetting.codeLength,
        isAutoRandomCodeCount: dailySetting.isAutoRandomCodeCount,
        generateTime: dailySetting.generateTime,
      };
    }

    return this.getDefaultSettings();
  }

  async getDefaultSettings(): Promise<ChallengeGenerationSettings> {
    const defaultSetting = await this.challengeSettingModel
      .findOne({ isDefault: true })
      .exec();

    if (!defaultSetting) {
      throw new NotFoundException('Default challenge settings not found');
    }

    return {
      codeCount: defaultSetting.codeCount,
      codeLength: defaultSetting.codeLength,
      isAutoRandomCodeCount: defaultSetting.isAutoRandomCodeCount,
      generateTime: defaultSetting.generateTime,
    };
  }

  async updateSettingChallenge(setting: ChallengeGenerationSettings): Promise<ChallengeGenerationSettings> { 
    await this.challengeSettingModel.updateOne(
      { isDefault: true },
      { $set: setting },
    );
    return this.getDefaultSettings();
  }

  resolveCodeCount(settings: ChallengeGenerationSettings): number {
    if (settings.isAutoRandomCodeCount) {
      return randomInt(
        AUTO_RANDOM_CODE_COUNT_MIN,
        AUTO_RANDOM_CODE_COUNT_MAX + 1,
      );
    }

    return settings.codeCount;
  }
}