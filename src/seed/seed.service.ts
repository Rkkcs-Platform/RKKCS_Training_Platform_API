import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { UserRole, UserStatus } from '../common/enums';
import {
  ChallengeSetting,
  ChallengeSettingDocument,
} from '../schemas/challenge-setting.schema';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);
  private readonly saltRounds = 10;

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(ChallengeSetting.name)
    private readonly challengeSettingModel: Model<ChallengeSettingDocument>,
  ) {}

  async onModuleInit() {
    await this.seedAdminUser();
    await this.seedDefaultChallengeSettings();
  }

  private async seedAdminUser() {
    const email = this.configService
      .get<string>('ADMIN_EMAIL', 'admin@gmail.com')
      .toLowerCase()
      .trim();
    const password = this.configService.get<string>(
      'ADMIN_PASSWORD',
      '123456',
    );
    const name = this.configService.get<string>('ADMIN_NAME', 'Admin');

    const existingAdmin = await this.userModel
      .findOne({ email, role: UserRole.ADMIN })
      .exec();

    if (existingAdmin) {
      this.logger.log(`Admin user already exists: ${email}`);
      return;
    }

    const passwordHash = await bcrypt.hash(password, this.saltRounds);

    await this.userModel.create({
      name,
      email,
      passwordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    });

    this.logger.log(`Seeded admin user: ${email}`);
  }

  private async seedDefaultChallengeSettings() {
    const existingDefault = await this.challengeSettingModel
      .findOne({ isDefault: true })
      .exec();

    if (existingDefault) {
      this.logger.log('Default challenge settings already exist');
      return;
    }

    await this.challengeSettingModel.create({
      codeCount: 20,
      codeLength: 8,
      generateTime: '03:00',
      isDefault: true,
    });

    this.logger.log('Seeded default challenge settings');
  }
}
