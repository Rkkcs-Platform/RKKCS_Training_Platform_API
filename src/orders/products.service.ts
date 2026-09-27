import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { FILL_PRODUCTS } from '../common/data/order-fill/products';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { ProductStatus } from '../common/enums';
import {
  buildPaginationMeta,
  parsePagination,
} from '../common/utils';
import { Product, ProductDocument } from '../schemas/product.schema';
import { UserDocument } from '../schemas/user.schema';
import { ShopsService } from '../shops/shops.service';
import {
  CreateProductDto,
  UpdateProductDto,
} from './dto/create-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    private readonly shopsService: ShopsService,
  ) {}

  async getAdminProducts(query: PaginationQueryDto & { shopId?: string }) {
    const { page, limit, skip } = parsePagination(query.page, query.limit);
    const filter: Record<string, unknown> = {};
    if (query.shopId) {
      if (!Types.ObjectId.isValid(query.shopId)) {
        throw new BadRequestException('Invalid shop ID');
      }
      filter.shopId = new Types.ObjectId(query.shopId);
    }

    const [items, total] = await Promise.all([
      this.productModel
        .find(filter)
        .populate('shopId', 'shopCode shopName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.productModel.countDocuments(filter).exec(),
    ]);

    return {
      items: items.map((item) => this.toResponse(item)),
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async createAdminProduct(shopId: string, dto: CreateProductDto) {
    if (!Types.ObjectId.isValid(shopId)) {
      throw new BadRequestException('Invalid shop ID');
    }

    await this.shopsService.findById(shopId);
    return this.createForShop(new Types.ObjectId(shopId), dto);
  }

  async updateAdminProduct(productId: string, dto: UpdateProductDto) {
    const product = await this.findById(productId);

    if (dto.name !== undefined) product.name = dto.name.trim();
    if (dto.description !== undefined) product.description = dto.description;
    if (dto.price !== undefined) product.price = dto.price;
    if (dto.status !== undefined) product.status = dto.status;
    if (dto.categoryId !== undefined) {
      if (!Types.ObjectId.isValid(dto.categoryId)) {
        throw new BadRequestException('Invalid category ID');
      }
      product.categoryId = new Types.ObjectId(dto.categoryId);
    }

    if (dto.isDefault === true) {
      await this.productModel
        .updateMany(
          { shopId: product.shopId, _id: { $ne: product._id } },
          { $set: { isDefault: false } },
        )
        .exec();
      product.isDefault = true;
    } else if (dto.isDefault === false) {
      product.isDefault = false;
    }

    await product.save();
    return this.toResponse(product);
  }

  async getShopOwnerProducts(user: UserDocument, query: PaginationQueryDto) {
    const shopId = await this.shopsService.resolveShopIdForUser(user);
    const { page, limit, skip } = parsePagination(query.page, query.limit);
    const catalogCount = await this.productModel
      .countDocuments({
        shopId,
        status: ProductStatus.ACTIVE,
        productCode: { $ne: 'DEFAULT' },
      })
      .exec();
    const filter: Record<string, unknown> = {
      shopId,
      status: ProductStatus.ACTIVE,
    };
    if (catalogCount > 0) {
      filter.productCode = { $ne: 'DEFAULT' };
    }

    const [items, total] = await Promise.all([
      this.productModel
        .find(filter)
        .sort({ isDefault: -1, name: 1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.productModel.countDocuments(filter).exec(),
    ]);

    return {
      items: items.map((item) => this.toResponse(item)),
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async getOrCreateDefaultProduct(
    shopId: Types.ObjectId,
  ): Promise<ProductDocument> {
    const catalogDefault = await this.productModel
      .findOne({
        shopId,
        isDefault: true,
        status: ProductStatus.ACTIVE,
        productCode: { $ne: 'DEFAULT' },
      })
      .exec();
    if (catalogDefault) return catalogDefault;

    const anyCatalog = await this.productModel
      .findOne({
        shopId,
        status: ProductStatus.ACTIVE,
        productCode: { $ne: 'DEFAULT' },
      })
      .sort({ createdAt: 1 })
      .exec();
    if (anyCatalog) {
      await this.productModel
        .updateMany({ shopId }, { $set: { isDefault: false } })
        .exec();
      anyCatalog.isDefault = true;
      await anyCatalog.save();
      return anyCatalog;
    }

    const existingStub = await this.productModel
      .findOne({ shopId, isDefault: true, status: ProductStatus.ACTIVE })
      .exec();
    if (existingStub) return existingStub;

    return this.productModel.create({
      shopId,
      productCode: 'DEFAULT',
      name: 'Sản phẩm mặc định',
      description: 'Tự tạo khi sinh đơn từ mã giao dịch',
      price: 1_980,
      status: ProductStatus.ACTIVE,
      isDefault: true,
    });
  }

  async findActiveByIdForShop(productId: string, shopId: Types.ObjectId) {
    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestException('Invalid product ID');
    }

    const product = await this.productModel
      .findOne({
        _id: productId,
        shopId,
        status: ProductStatus.ACTIVE,
      })
      .exec();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async ensureCatalogForShop(shopId: Types.ObjectId): Promise<{
    created: number;
    existing: number;
  }> {
    const codes = FILL_PRODUCTS.map((item) => item.productCode.trim().toUpperCase());
    const existing = await this.productModel
      .find({ shopId, productCode: { $in: codes } })
      .select('productCode')
      .lean()
      .exec();
    const have = new Set(existing.map((item) => item.productCode));
    const missing = FILL_PRODUCTS.filter(
      (item) => !have.has(item.productCode.trim().toUpperCase()),
    );

    if (missing.length) {
      await this.productModel.insertMany(
        missing.map((item) => ({
          shopId,
          productCode: item.productCode.trim().toUpperCase(),
          name: item.name,
          description: item.description,
          price: item.price,
          status: ProductStatus.ACTIVE,
          isDefault: false,
        })),
        { ordered: false },
      );
    }

    return { created: missing.length, existing: have.size };
  }

  async promoteCatalogAsDefault(shopId: Types.ObjectId): Promise<void> {
    const catalog = await this.productModel
      .findOne({
        shopId,
        status: ProductStatus.ACTIVE,
        productCode: { $ne: 'DEFAULT' },
      })
      .sort({ productCode: 1 })
      .exec();
    if (!catalog) return;

    await this.productModel
      .updateMany({ shopId }, { $set: { isDefault: false } })
      .exec();
    catalog.isDefault = true;
    await catalog.save();

    await this.productModel
      .updateMany(
        { shopId, productCode: 'DEFAULT' },
        { $set: { status: ProductStatus.INACTIVE, isDefault: false } },
      )
      .exec();
  }

  async listStubProductIds(shopId: Types.ObjectId): Promise<string[]> {
    const stubs = await this.productModel
      .find({
        shopId,
        $or: [
          { productCode: 'DEFAULT' },
          { name: /^sản phẩm mặc định$/i },
        ],
      })
      .select('_id')
      .exec();
    return stubs.map((item) => item._id.toString());
  }

  async listAssignableProducts(
    shopId: Types.ObjectId,
  ): Promise<ProductDocument[]> {
    return this.productModel
      .find({
        shopId,
        status: ProductStatus.ACTIVE,
        productCode: { $ne: 'DEFAULT' },
      })
      .exec();
  }

  private async createForShop(shopId: Types.ObjectId, dto: CreateProductDto) {
    const productCode = dto.productCode.trim().toUpperCase();
    const exists = await this.productModel
      .findOne({ shopId, productCode })
      .exec();
    if (exists) {
      throw new ConflictException(`Product code ${productCode} already exists`);
    }

    if (dto.isDefault) {
      await this.productModel
        .updateMany({ shopId }, { $set: { isDefault: false } })
        .exec();
    }

    const product = await this.productModel.create({
      shopId,
      productCode,
      name: dto.name.trim(),
      description: dto.description,
      price: dto.price,
      status: dto.status ?? ProductStatus.ACTIVE,
      isDefault: dto.isDefault ?? false,
      categoryId: dto.categoryId
        ? new Types.ObjectId(dto.categoryId)
        : undefined,
    });

    return this.toResponse(product);
  }

  private async findById(productId: string) {
    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestException('Invalid product ID');
    }

    const product = await this.productModel.findById(productId).exec();
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  private toResponse(product: ProductDocument) {
    const shop = product.shopId as unknown as {
      _id?: Types.ObjectId;
      shopCode?: string;
      shopName?: string;
    };

    const rawShopId = product.shopId as unknown as
      | Types.ObjectId
      | { _id: Types.ObjectId };

    return {
      id: product._id.toString(),
      shopId:
        shop?._id?.toString() ??
        (typeof rawShopId === 'object' &&
        rawShopId !== null &&
        '_id' in rawShopId
          ? rawShopId._id.toString()
          : String(rawShopId)),
      shop: shop?.shopCode
        ? {
            id: shop._id?.toString(),
            shopCode: shop.shopCode,
            shopName: shop.shopName,
          }
        : undefined,
      productCode: product.productCode,
      name: product.name,
      description: product.description,
      price: product.price,
      status: product.status,
      isDefault: Boolean(product.isDefault),
      categoryId: product.categoryId?.toString(),
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}
