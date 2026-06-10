import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ChallengeSetting,
  ChallengeSettingDocument,
} from '../schemas/challenge-setting.schema';

export interface ChallengeGenerationSettings {
  codeCount: number;
  codeLength: number;
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
      generateTime: defaultSetting.generateTime,
    };
  }
}
