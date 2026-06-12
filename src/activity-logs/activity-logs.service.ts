import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ActorRole, UserRole } from '../common/enums';
import {
  buildPaginationMeta,
  parsePagination,
} from '../common/utils';
import { ActivityLog, ActivityLogDocument } from '../schemas/activity-log.schema';
import { UserDocument } from '../schemas/user.schema';
import { ActivityLogQueryDto } from './dto/activity-log-query.dto';

export interface RecordActivityInput {
  action: string;
  actorId?: Types.ObjectId | string;
  actorRole?: ActorRole;
  targetType?: string;
  targetId?: Types.ObjectId | string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class ActivityLogsService {
  private readonly logger = new Logger(ActivityLogsService.name);

  constructor(
    @InjectModel(ActivityLog.name)
    private readonly activityLogModel: Model<ActivityLogDocument>,
  ) {}

  record(input: RecordActivityInput): void {
    void this.persist(input).catch((error) => {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to write activity log: ${message}`);
    });
  }

  recordFromUser(
    user: UserDocument,
    input: Omit<RecordActivityInput, 'actorId' | 'actorRole'>,
  ): void {
    this.record({
      ...input,
      actorId: user._id,
      actorRole: this.toActorRole(user.role),
    });
  }

  async findAll(query: ActivityLogQueryDto) {
    const { page, limit, skip } = parsePagination(query.page, query.limit);
    const filter: Record<string, unknown> = {};

    if (query.action) {
      filter.action = query.action;
    }

    if (query.actorId) {
      if (!Types.ObjectId.isValid(query.actorId)) {
        return {
          items: [],
          meta: buildPaginationMeta(0, page, limit),
        };
      }

      filter.actorId = new Types.ObjectId(query.actorId);
    }

    if (query.targetType) {
      filter.targetType = query.targetType;
    }

    if (query.from || query.to) {
      const createdAt: Record<string, Date> = {};

      if (query.from) {
        createdAt.$gte = new Date(`${query.from}T00:00:00.000Z`);
      }

      if (query.to) {
        createdAt.$lte = new Date(`${query.to}T23:59:59.999Z`);
      }

      filter.createdAt = createdAt;
    }

    const [items, total] = await Promise.all([
      this.activityLogModel
        .find(filter)
        .populate('actorId', 'name email role staffCode')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.activityLogModel.countDocuments(filter).exec(),
    ]);

    return {
      items: items.map((item) => this.toListItem(item)),
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  private async persist(input: RecordActivityInput) {
    await this.activityLogModel.create({
      action: input.action,
      actorId: input.actorId
        ? new Types.ObjectId(input.actorId.toString())
        : undefined,
      actorRole: input.actorRole,
      targetType: input.targetType,
      targetId: input.targetId
        ? new Types.ObjectId(input.targetId.toString())
        : undefined,
      metadata: input.metadata,
    });
  }

  private toActorRole(role: UserRole): ActorRole {
    return role === UserRole.ADMIN ? ActorRole.ADMIN : ActorRole.USER;
  }

  private toListItem(log: ActivityLogDocument) {
    const actor = log.actorId as unknown as UserDocument | null;

    return {
      id: log._id.toString(),
      action: log.action,
      actorRole: log.actorRole,
      actor: actor
        ? {
            id: actor._id.toString(),
            name: actor.name,
            email: actor.email,
            role: actor.role,
            staffCode: actor.staffCode,
          }
        : null,
      targetType: log.targetType,
      targetId: log.targetId?.toString(),
      metadata: log.metadata ?? {},
      createdAt: log.createdAt,
    };
  }
}
