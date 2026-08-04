import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { NewsStatus } from '../common/enums';
import {
  buildPaginationMeta,
  parsePagination,
} from '../common/utils';
import { News, NewsDocument } from '../schemas/news.schema';
import { UserDocument } from '../schemas/user.schema';
import { CreateNewsDto, UpdateNewsDto } from './dto/create-news.dto';

@Injectable()
export class NewsService {
  constructor(
    @InjectModel(News.name)
    private readonly newsModel: Model<NewsDocument>,
  ) {}

  async findAdminAll(query: PaginationQueryDto & { status?: NewsStatus }) {
    const { page, limit, skip } = parsePagination(query.page, query.limit);
    const filter: Record<string, unknown> = {};
    if (query.status) filter.status = query.status;

    const [items, total] = await Promise.all([
      this.newsModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.newsModel.countDocuments(filter).exec(),
    ]);

    return {
      items: items.map((item) => this.toResponse(item)),
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async findPublished(query: PaginationQueryDto) {
    const { page, limit, skip } = parsePagination(query.page, query.limit);
    const filter = { status: NewsStatus.PUBLISHED };

    const [items, total] = await Promise.all([
      this.newsModel
        .find(filter)
        .sort({ publishedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.newsModel.countDocuments(filter).exec(),
    ]);

    return {
      items: items.map((item) => this.toResponse(item)),
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async findPublishedBySlug(slug: string) {
    const news = await this.newsModel
      .findOne({
        slug: slug.trim().toLowerCase(),
        status: NewsStatus.PUBLISHED,
      })
      .exec();
    if (!news) {
      throw new NotFoundException('News not found');
    }
    return this.toResponse(news);
  }

  async create(dto: CreateNewsDto, author?: UserDocument) {
    const slug = await this.ensureUniqueSlug(
      dto.slug?.trim() || this.slugify(dto.title),
    );
    const status = dto.status ?? NewsStatus.DRAFT;

    const news = await this.newsModel.create({
      title: dto.title.trim(),
      slug,
      summary: dto.summary.trim(),
      content: dto.content.trim(),
      coverImageUrl: dto.coverImageUrl,
      status,
      authorId: author?._id,
      publishedAt: status === NewsStatus.PUBLISHED ? new Date() : undefined,
    });

    return this.toResponse(news);
  }

  async update(id: string, dto: UpdateNewsDto) {
    const news = await this.findById(id);

    if (dto.title !== undefined) news.title = dto.title.trim();
    if (dto.summary !== undefined) news.summary = dto.summary.trim();
    if (dto.content !== undefined) news.content = dto.content.trim();
    if (dto.coverImageUrl !== undefined) {
      news.coverImageUrl = dto.coverImageUrl;
    }

    if (dto.slug !== undefined) {
      news.slug = await this.ensureUniqueSlug(
        dto.slug.trim().toLowerCase(),
        news._id.toString(),
      );
    }

    if (dto.status !== undefined) {
      if (
        dto.status === NewsStatus.PUBLISHED &&
        news.status !== NewsStatus.PUBLISHED
      ) {
        news.publishedAt = new Date();
      }
      news.status = dto.status;
    }

    await news.save();
    return this.toResponse(news);
  }

  private async findById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid news ID');
    }
    const news = await this.newsModel.findById(id).exec();
    if (!news) {
      throw new NotFoundException('News not found');
    }
    return news;
  }

  private async ensureUniqueSlug(base: string, excludeId?: string) {
    let slug = this.slugify(base);
    if (!slug) slug = `news-${Date.now()}`;

    let candidate = slug;
    let i = 1;
    while (true) {
      const filter: Record<string, unknown> = { slug: candidate };
      if (excludeId) filter._id = { $ne: new Types.ObjectId(excludeId) };
      const exists = await this.newsModel.findOne(filter).exec();
      if (!exists) return candidate;
      candidate = `${slug}-${i}`;
      i += 1;
      if (i > 50) {
        throw new ConflictException('Unable to generate unique slug');
      }
    }
  }

  private slugify(value: string) {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 200);
  }

  private toResponse(news: NewsDocument) {
    return {
      id: news._id.toString(),
      title: news.title,
      slug: news.slug,
      summary: news.summary,
      content: news.content,
      coverImageUrl: news.coverImageUrl,
      status: news.status,
      authorId: news.authorId?.toString(),
      publishedAt: news.publishedAt,
      createdAt: news.createdAt,
      updatedAt: news.updatedAt,
    };
  }
}
