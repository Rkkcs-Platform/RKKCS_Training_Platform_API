import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { ShopStatus, UserRole, UserStatus } from '../common/enums';
import {
  Challenge,
  ChallengeDocument,
} from '../schemas/challenge.schema';
import {
  ChallengeSetting,
  ChallengeSettingDocument,
} from '../schemas/challenge-setting.schema';
import { Shop, ShopDocument } from '../schemas/shop.schema';
import { Customer, CustomerDocument } from '../schemas/customer.schema';
import { User, UserDocument } from '../schemas/user.schema';
import {
  UserSubmission,
  UserSubmissionDocument,
} from '../schemas/user-submission.schema';
import { DEFAULT_SHOP_CODE } from '../shops/shops.service';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);
  private readonly saltRounds = 10;

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(ChallengeSetting.name)
    private readonly challengeSettingModel: Model<ChallengeSettingDocument>,
    @InjectModel(Shop.name) private readonly shopModel: Model<ShopDocument>,
    @InjectModel(Challenge.name)
    private readonly challengeModel: Model<ChallengeDocument>,
    @InjectModel(UserSubmission.name)
    private readonly submissionModel: Model<UserSubmissionDocument>,
    @InjectModel(Customer.name)
    private readonly customerModel: Model<CustomerDocument>,
  ) {}

  async onModuleInit() {
    await this.seedAdminUser();
    await this.seedDefaultChallengeSettings();
    const defaultShop = await this.seedDefaultShop();
    await this.migrateChallengeIndexes();
    await this.backfillShopIds(defaultShop);
    await this.backfillPlaceholderCustomerNames();
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
      isAutoRandomCodeCount: false,
      isDefault: true,
    });

    this.logger.log('Seeded default challenge settings');
  }

  private async seedDefaultShop(): Promise<ShopDocument> {
    const existing = await this.shopModel
      .findOne({ shopCode: DEFAULT_SHOP_CODE })
      .exec();

    if (existing) {
      this.logger.log('Default shop already exists');
      return existing;
    }

    const admin = await this.userModel
      .findOne({ role: UserRole.ADMIN })
      .sort({ createdAt: 1 })
      .exec();

    if (!admin) {
      throw new Error('Cannot seed DEFAULT shop: no admin user found');
    }

    const shop = await this.shopModel.create({
      shopCode: DEFAULT_SHOP_CODE,
      shopName: 'Default Shop',
      ownerId: admin._id,
      status: ShopStatus.ACTIVE,
    });

    this.logger.log('Seeded default shop: DEFAULT');
    return shop;
  }

  private async migrateChallengeIndexes() {
    try {
      const indexes = await this.challengeModel.collection.indexes();
      const legacyDateUnique = indexes.find(
        (index) =>
          index.unique === true &&
          index.key &&
          Object.keys(index.key).length === 1 &&
          index.key.date === 1,
      );

      if (legacyDateUnique?.name) {
        await this.challengeModel.collection.dropIndex(legacyDateUnique.name);
        this.logger.log(
          `Dropped legacy challenge index: ${legacyDateUnique.name}`,
        );
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown index migration error';
      this.logger.warn(`Challenge index migration skipped: ${message}`);
    }
  }

  private async backfillShopIds(defaultShop: ShopDocument) {
    const shopId = defaultShop._id;

    const challengeResult = await this.challengeModel
      .updateMany(
        { $or: [{ shopId: { $exists: false } }, { shopId: null }] },
        { $set: { shopId } },
      )
      .exec();

    const submissionResult = await this.submissionModel
      .updateMany(
        { $or: [{ shopId: { $exists: false } }, { shopId: null }] },
        { $set: { shopId } },
      )
      .exec();

    const userResult = await this.userModel
      .updateMany(
        {
          role: UserRole.USER,
          $or: [{ shopId: { $exists: false } }, { shopId: null }],
        },
        { $set: { shopId } },
      )
      .exec();

    this.logger.log(
      `Backfilled shopId — challenges: ${challengeResult.modifiedCount}, submissions: ${submissionResult.modifiedCount}, users: ${userResult.modifiedCount}`,
    );
  }

  private async backfillPlaceholderCustomerNames() {
    const stubs = await this.customerModel
      .find({ customerCode: { $regex: '^CUS-' } })
      .exec();

    let modified = 0;
    for (const customer of stubs) {
      const code = customer.customerCode.replace(/^CUS-/i, '');
      const name = (customer.fullName || '').trim();
      const looksLikeCodePlaceholder =
        !name ||
        /^customer\s+/i.test(name) ||
        name.toUpperCase() === code.toUpperCase() ||
        name.toUpperCase() === `CUSTOMER ${code}`.toUpperCase();

      if (looksLikeCodePlaceholder) {
        customer.fullName = 'Chưa cập nhật';
        await customer.save();
        modified += 1;
      }
    }

    this.logger.log(`Normalized placeholder customer names: ${modified}`);
  }
}
