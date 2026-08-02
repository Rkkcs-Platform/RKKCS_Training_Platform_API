import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ShopStatus, UserRole } from '../common/enums';
import {
  buildPaginationMeta,
  parsePagination,
} from '../common/utils';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { Shop, ShopDocument } from '../schemas/shop.schema';
import { User, UserDocument } from '../schemas/user.schema';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';

export const DEFAULT_SHOP_CODE = 'DEFAULT';

@Injectable()
export class ShopsService {
  constructor(
    @InjectModel(Shop.name) private readonly shopModel: Model<ShopDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async findAll(query: PaginationQueryDto) {
    const { page, limit, skip } = parsePagination(query.page, query.limit);
    const [items, total] = await Promise.all([
      this.shopModel
        .find()
        .populate('ownerId', 'name email staffCode')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.shopModel.countDocuments().exec(),
    ]);

    return {
      items: items.map((item) => this.toResponse(item)),
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async findById(shopId: string): Promise<ShopDocument> {
    if (!Types.ObjectId.isValid(shopId)) {
      throw new BadRequestException('Invalid shop ID');
    }

    const shop = await this.shopModel
      .findById(shopId)
      .populate('ownerId', 'name email staffCode')
      .exec();

    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    return shop;
  }

  async create(dto: CreateShopDto) {
    const shopCode = dto.shopCode.trim().toUpperCase();
    const existingCode = await this.shopModel.findOne({ shopCode }).exec();

    if (existingCode) {
      throw new ConflictException(`Shop code ${shopCode} already exists`);
    }

    if (!Types.ObjectId.isValid(dto.ownerId)) {
      throw new BadRequestException('Invalid owner ID');
    }

    const owner = await this.userModel.findById(dto.ownerId).exec();

    if (!owner) {
      throw new NotFoundException('Owner user not found');
    }

    if (owner.role !== UserRole.USER) {
      throw new BadRequestException('Shop owner must have role user');
    }

    await this.assertUserCanBecomeOwner(owner);

    const shop = await this.shopModel.create({
      shopCode,
      shopName: dto.shopName.trim(),
      ownerId: owner._id,
      status: dto.status ?? ShopStatus.ACTIVE,
    });

    owner.shopId = shop._id;
    await owner.save();

    const populated = await this.shopModel
      .findById(shop._id)
      .populate('ownerId', 'name email staffCode')
      .exec();

    return this.toResponse(populated!);
  }

  /**
   * Create a dedicated shop for an existing user (does not delete the account).
   * If the user only belongs to DEFAULT (member, not owner), they can be moved.
   */
  async ensureShopForUser(dto: {
    userId: string;
    shopCode: string;
    shopName: string;
  }) {
    if (!Types.ObjectId.isValid(dto.userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.userModel.findById(dto.userId).exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== UserRole.USER) {
      throw new BadRequestException('Only role user can own a shop');
    }

    // Already owner of a non-default shop → return that shop
    if (user.shopId) {
      const current = await this.shopModel.findById(user.shopId).exec();
      if (
        current &&
        current.ownerId.toString() === user._id.toString() &&
        current.shopCode !== DEFAULT_SHOP_CODE
      ) {
        const populated = await this.shopModel
          .findById(current._id)
          .populate('ownerId', 'name email staffCode')
          .exec();
        return this.toResponse(populated!);
      }
    }

    return this.create({
      shopCode: dto.shopCode,
      shopName: dto.shopName,
      ownerId: user._id.toString(),
    });
  }

  async assignUserToShop(
    userId: string,
    shopId: string,
    setAsOwner = false,
  ) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.userModel.findById(userId).exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== UserRole.USER) {
      throw new BadRequestException('Only role user can be assigned to a shop');
    }

    const shop = await this.findById(shopId);

    if (setAsOwner) {
      await this.assertUserCanBecomeOwner(user, shop._id.toString());

      const previousOwnerId = shop.ownerId;
      shop.ownerId = user._id;
      await shop.save();

      await this.userModel
        .updateOne(
          { _id: previousOwnerId, shopId: shop._id },
          { $unset: { shopId: 1 } },
        )
        .exec();
    }

    user.shopId = shop._id;
    await user.save();

    return {
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      shopId: shop._id.toString(),
      shopCode: shop.shopCode,
      shopName: shop.shopName,
    };
  }

  async listShopUsers() {
    const users = await this.userModel
      .find({ role: UserRole.USER })
      .select('name email staffCode shopId status createdAt')
      .sort({ createdAt: -1 })
      .exec();

    const shopIds = [
      ...new Set(
        users
          .map((user) => user.shopId?.toString())
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    const shops = await this.shopModel
      .find({ _id: { $in: shopIds } })
      .select('shopCode shopName ownerId')
      .exec();

    const shopMap = new Map(
      shops.map((shop) => [shop._id.toString(), shop]),
    );

    return users.map((user) => {
      const shop = user.shopId
        ? shopMap.get(user.shopId.toString())
        : undefined;

      return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        staffCode: user.staffCode,
        status: user.status,
        shopId: user.shopId?.toString(),
        shopCode: shop?.shopCode,
        shopName: shop?.shopName,
        isShopOwner: shop
          ? shop.ownerId.toString() === user._id.toString()
          : false,
        createdAt: user.createdAt,
      };
    });
  }

  private async assertUserCanBecomeOwner(
    owner: UserDocument,
    ignoreShopId?: string,
  ) {
    if (!owner.shopId) {
      return;
    }

    if (ignoreShopId && owner.shopId.toString() === ignoreShopId) {
      return;
    }

    const currentShop = await this.shopModel.findById(owner.shopId).exec();

    if (!currentShop) {
      return;
    }

    // Shared DEFAULT shop — can move user to their own shop
    if (currentShop.shopCode === DEFAULT_SHOP_CODE) {
      return;
    }

    const isOwner = currentShop.ownerId.toString() === owner._id.toString();

    // Member of another shop (not owner) — can be reassigned
    if (!isOwner) {
      return;
    }

    throw new ConflictException(
      'User already owns a shop. Use a different owner or update that shop.',
    );
  }

  async update(shopId: string, dto: UpdateShopDto) {
    const shop = await this.findById(shopId);

    if (dto.shopCode) {
      const shopCode = dto.shopCode.trim().toUpperCase();
      const existingCode = await this.shopModel
        .findOne({ shopCode, _id: { $ne: shop._id } })
        .exec();

      if (existingCode) {
        throw new ConflictException(`Shop code ${shopCode} already exists`);
      }

      shop.shopCode = shopCode;
    }

    if (dto.shopName !== undefined) {
      shop.shopName = dto.shopName.trim();
    }

    if (dto.status !== undefined) {
      shop.status = dto.status;
    }

    if (dto.ownerId && dto.ownerId !== shop.ownerId.toString()) {
      if (!Types.ObjectId.isValid(dto.ownerId)) {
        throw new BadRequestException('Invalid owner ID');
      }

      const newOwner = await this.userModel.findById(dto.ownerId).exec();

      if (!newOwner) {
        throw new NotFoundException('Owner user not found');
      }

      if (newOwner.role !== UserRole.USER) {
        throw new BadRequestException('Shop owner must have role user');
      }

      if (
        newOwner.shopId &&
        newOwner.shopId.toString() !== shop._id.toString()
      ) {
        throw new ConflictException('Owner already belongs to another shop');
      }

      const previousOwnerId = shop.ownerId;
      shop.ownerId = newOwner._id;
      newOwner.shopId = shop._id;
      await newOwner.save();

      await this.userModel
        .updateOne(
          { _id: previousOwnerId, shopId: shop._id },
          { $unset: { shopId: 1 } },
        )
        .exec();
    }

    await shop.save();

    const populated = await this.shopModel
      .findById(shop._id)
      .populate('ownerId', 'name email staffCode')
      .exec();

    return this.toResponse(populated!);
  }

  async getDefaultShop(): Promise<ShopDocument> {
    const shop = await this.shopModel
      .findOne({ shopCode: DEFAULT_SHOP_CODE })
      .exec();

    if (!shop) {
      throw new NotFoundException('Default shop not found');
    }

    return shop;
  }

  async getDefaultShopId(): Promise<Types.ObjectId> {
    const shop = await this.getDefaultShop();
    return shop._id;
  }

  async resolveShopIdForUser(
    user: UserDocument,
  ): Promise<Types.ObjectId> {
    if (user.shopId) {
      return user.shopId;
    }

    return this.getDefaultShopId();
  }

  async getShopForOwner(user: UserDocument) {
    const shopId = await this.resolveShopIdForUser(user);
    const shop = await this.shopModel
      .findById(shopId)
      .populate('ownerId', 'name email staffCode')
      .exec();
    if (!shop) {
      throw new NotFoundException('Shop not found');
    }
    return this.toResponse(shop);
  }

  async updateShopForOwner(
    user: UserDocument,
    dto: { shopName?: string },
  ) {
    const shopId = await this.resolveShopIdForUser(user);
    const shop = await this.shopModel.findById(shopId).exec();
    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    const isOwner = shop.ownerId.toString() === user._id.toString();
    if (!isOwner && user.role !== UserRole.ADMIN) {
      throw new BadRequestException('Only shop owner can update shop settings');
    }

    if (dto.shopName !== undefined) {
      shop.shopName = dto.shopName.trim();
    }

    await shop.save();
    const populated = await this.shopModel
      .findById(shop._id)
      .populate('ownerId', 'name email staffCode')
      .exec();
    return this.toResponse(populated!);
  }

  async findActiveShops(): Promise<ShopDocument[]> {
    return this.shopModel.find({ status: ShopStatus.ACTIVE }).exec();
  }

  toResponse(shop: ShopDocument) {
    const owner = shop.ownerId as unknown as UserDocument | Types.ObjectId;
    const ownerIsPopulated =
      owner &&
      typeof owner === 'object' &&
      'email' in owner;

    return {
      id: shop._id.toString(),
      shopCode: shop.shopCode,
      shopName: shop.shopName,
      status: shop.status,
      ownerId: ownerIsPopulated
        ? (owner as UserDocument)._id.toString()
        : shop.ownerId.toString(),
      owner: ownerIsPopulated
        ? {
            id: (owner as UserDocument)._id.toString(),
            name: (owner as UserDocument).name,
            email: (owner as UserDocument).email,
            staffCode: (owner as UserDocument).staffCode,
          }
        : undefined,
      createdAt: shop.createdAt,
      updatedAt: shop.updatedAt,
    };
  }
}
