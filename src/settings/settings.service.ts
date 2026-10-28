import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomInt } from 'crypto';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { Model } from 'mongoose';
import {
  APP_TIMEZONE,
  AUTO_RANDOM_CODE_COUNT_MAX,
  AUTO_RANDOM_CODE_COUNT_MIN,
} from '../common/constants/app.constant';
import {
  ChallengeSetting,
  ChallengeSettingDocument,
} from '../schemas/challenge-setting.schema';
import { ApiLocale, setDefaultAppLanguage } from '../common/utils/i18n.util';

dayjs.extend(utc);
dayjs.extend(timezone);

export type MaintenanceStatus = {
  maintenance: boolean;
  language: string;
  until: string | null;
};

export interface ChallengeGenerationSettings {
  codeCount: number;
  codeLength: number;
  isAutoRandomCodeCount: boolean;
  generateTime: string;
}

@Injectable()
export class SettingsService implements OnModuleInit {
  constructor(
    @InjectModel(ChallengeSetting.name)
    private readonly challengeSettingModel: Model<ChallengeSettingDocument>,
  ) {}

  async onModuleInit() {
    try {
      const setting = await this.challengeSettingModel
        .findOne({ isDefault: true })
        .exec();
      if (setting && setting.language) {
        setDefaultAppLanguage(setting.language as ApiLocale);
      }
    } catch (err) {
      // Ignore database connection issues during seeding / setup
    }
  }

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

  async getMaintenanceStatus(): Promise<MaintenanceStatus> {
    await this.clearExpiredMaintenance();

    const setting = await this.challengeSettingModel
      .findOne({ isDefault: true })
      .exec();

    return {
      maintenance: setting?.maintenanceMode ?? false,
      language: setting?.language ?? 'vi',
      until: setting?.maintenanceUntil
        ? setting.maintenanceUntil.toISOString()
        : null,
    };
  }

  async setMaintenanceMode(
    enabled: boolean,
    untilTime?: string,
  ): Promise<MaintenanceStatus> {
    if (!enabled) {
      await this.challengeSettingModel.updateOne(
        { isDefault: true },
        { $set: { maintenanceMode: false, maintenanceUntil: null } },
      );
      return this.getMaintenanceStatus();
    }

    const until = this.resolveMaintenanceUntil(untilTime);
    await this.challengeSettingModel.updateOne(
      { isDefault: true },
      { $set: { maintenanceMode: true, maintenanceUntil: until } },
    );
    return this.getMaintenanceStatus();
  }

  /** Turns maintenance off when until time has passed. Returns true if cleared. */
  async clearExpiredMaintenance(): Promise<boolean> {
    const setting = await this.challengeSettingModel
      .findOne({ isDefault: true, maintenanceMode: true })
      .exec();
    if (!setting?.maintenanceUntil) return false;

    if (dayjs(setting.maintenanceUntil).isAfter(dayjs())) {
      return false;
    }

    await this.challengeSettingModel.updateOne(
      { _id: setting._id },
      { $set: { maintenanceMode: false, maintenanceUntil: null } },
    );
    return true;
  }

  private resolveMaintenanceUntil(untilTime?: string): Date {
    if (!untilTime || !/^\d{2}:\d{2}$/.test(untilTime)) {
      throw new BadRequestException(
        'Chọn giờ kết thúc bảo trì (HH:mm) trong ngày hôm nay',
      );
    }

    const [hourText, minuteText] = untilTime.split(':');
    const hour = Number(hourText);
    const minute = Number(minuteText);
    if (
      !Number.isInteger(hour) ||
      !Number.isInteger(minute) ||
      hour < 0 ||
      hour > 23 ||
      minute < 0 ||
      minute > 59
    ) {
      throw new BadRequestException('Giờ kết thúc bảo trì không hợp lệ');
    }

    const until = dayjs()
      .tz(APP_TIMEZONE)
      .hour(hour)
      .minute(minute)
      .second(0)
      .millisecond(0);

    if (!until.isAfter(dayjs().tz(APP_TIMEZONE))) {
      throw new BadRequestException(
        'Giờ kết thúc phải sau thời điểm hiện tại trong hôm nay',
      );
    }

    return until.toDate();
  }

  async setLanguage(language: string): Promise<{ language: string }> {
    await this.challengeSettingModel.updateOne(
      { isDefault: true },
      { $set: { language } },
    );
    setDefaultAppLanguage(language as ApiLocale);
    return { language };
  }
}