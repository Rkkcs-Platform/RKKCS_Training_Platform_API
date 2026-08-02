import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ShopStatus } from '../common/enums';

export type ShopDocument = HydratedDocument<Shop>;

@Schema({ timestamps: true, collection: 'shops' })
export class Shop {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  ownerId: Types.ObjectId;

  @Prop({ required: true, trim: true, uppercase: true })
  shopCode: string;

  @Prop({ required: true, trim: true })
  shopName: string;

  @Prop({ required: true, enum: ShopStatus, default: ShopStatus.ACTIVE })
  status: ShopStatus;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ShopSchema = SchemaFactory.createForClass(Shop);

ShopSchema.index({ shopCode: 1 }, { unique: true });
ShopSchema.index({ ownerId: 1 });
ShopSchema.index({ status: 1 });
