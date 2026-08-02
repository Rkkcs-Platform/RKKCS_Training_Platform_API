import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { CategoryStatus } from '../common/enums';
import {
  buildPaginationMeta,
  parsePagination,
} from '../common/utils';
import { Category, CategoryDocument } from '../schemas/category.schema';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
} from './dto/create-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
  ) {}

  async findAll(query: PaginationQueryDto & { status?: CategoryStatus }) {
    const { page, limit, skip } = parsePagination(query.page, query.limit);
    const filter: Record<string, unknown> = {};
    if (query.status) filter.status = query.status;

    const [items, total] = await Promise.all([
      this.categoryModel
        .find(filter)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.categoryModel.countDocuments(filter).exec(),
    ]);

    return {
      items: items.map((item) => this.toResponse(item)),
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async create(dto: CreateCategoryDto) {
    const categoryCode = dto.categoryCode.trim().toUpperCase();
    const exists = await this.categoryModel.findOne({ categoryCode }).exec();
    if (exists) {
      throw new ConflictException(`Category code ${categoryCode} already exists`);
    }

    if (dto.shopId && !Types.ObjectId.isValid(dto.shopId)) {
      throw new BadRequestException('Invalid shop ID');
    }

    const category = await this.categoryModel.create({
      categoryCode,
      name: dto.name.trim(),
      description: dto.description,
      shopId: dto.shopId ? new Types.ObjectId(dto.shopId) : undefined,
      status: dto.status ?? CategoryStatus.ACTIVE,
    });

    return this.toResponse(category);
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const category = await this.findById(id);

    if (dto.categoryCode !== undefined) {
      const categoryCode = dto.categoryCode.trim().toUpperCase();
      const exists = await this.categoryModel
        .findOne({ categoryCode, _id: { $ne: category._id } })
        .exec();
      if (exists) {
        throw new ConflictException(
          `Category code ${categoryCode} already exists`,
        );
      }
      category.categoryCode = categoryCode;
    }

    if (dto.name !== undefined) category.name = dto.name.trim();
    if (dto.description !== undefined) category.description = dto.description;
    if (dto.status !== undefined) category.status = dto.status;
    if (dto.shopId !== undefined) {
      if (dto.shopId === '') {
        category.shopId = undefined;
      } else {
        if (!Types.ObjectId.isValid(dto.shopId)) {
          throw new BadRequestException('Invalid shop ID');
        }
        category.shopId = new Types.ObjectId(dto.shopId);
      }
    }

    await category.save();
    return this.toResponse(category);
  }

  async deactivate(id: string) {
    return this.update(id, { status: CategoryStatus.INACTIVE });
  }

  async findById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid category ID');
    }
    const category = await this.categoryModel.findById(id).exec();
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  toResponse(category: CategoryDocument) {
    return {
      id: category._id.toString(),
      shopId: category.shopId?.toString(),
      categoryCode: category.categoryCode,
      name: category.name,
      description: category.description,
      status: category.status,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }
}
