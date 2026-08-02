import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { NewsStatus } from '../common/enums';

export type NewsDocument = HydratedDocument<News>;

@Schema({ timestamps: true, collection: 'news' })
export class News {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, trim: true, lowercase: true })
  slug: string;

  @Prop({ required: true, trim: true })
  summary: string;

  @Prop({ required: true, trim: true })
  content: string;

  @Prop({ trim: true })
  coverImageUrl?: string;

  @Prop({
    required: true,
    enum: NewsStatus,
    default: NewsStatus.DRAFT,
  })
  status: NewsStatus;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  authorId?: Types.ObjectId;

  @Prop()
  publishedAt?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export const NewsSchema = SchemaFactory.createForClass(News);

NewsSchema.index({ slug: 1 }, { unique: true });
NewsSchema.index({ status: 1, publishedAt: -1 });
