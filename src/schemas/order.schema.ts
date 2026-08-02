import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { OrderStatus } from '../common/enums';

export type OrderDocument = HydratedDocument<Order>;

@Schema({ timestamps: true, collection: 'orders' })
export class Order {
  @Prop({ type: Types.ObjectId, ref: 'Shop', required: true })
  shopId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Customer', required: true })
  customerId: Types.ObjectId;

  @Prop({ required: true, trim: true, uppercase: true })
  orderCode: string;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ required: true, enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Prop({ required: true, trim: true, uppercase: true })
  transactionCode: string;

  @Prop({ type: Types.ObjectId, ref: 'Challenge' })
  batchId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'UserSubmission' })
  submissionId?: Types.ObjectId;

  createdAt?: Date;
  updatedAt?: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

OrderSchema.index({ transactionCode: 1 }, { unique: true });
OrderSchema.index({ shopId: 1, createdAt: -1 });
OrderSchema.index({ customerId: 1 });
OrderSchema.index({ batchId: 1 });
OrderSchema.index({ status: 1 });
