import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ShipmentStatus } from '../common/enums';

export type ShipmentEventDocument = HydratedDocument<ShipmentEvent>;

@Schema({ timestamps: { createdAt: true, updatedAt: false }, collection: 'shipment_events' })
export class ShipmentEvent {
  @Prop({ type: Types.ObjectId, ref: 'Shipment', required: true })
  shipmentId: Types.ObjectId;

  @Prop({ required: true, enum: ShipmentStatus })
  status: ShipmentStatus;

  @Prop({ trim: true })
  location?: string;

  @Prop({ trim: true })
  note?: string;

  createdAt?: Date;
}

export const ShipmentEventSchema = SchemaFactory.createForClass(ShipmentEvent);

ShipmentEventSchema.index({ shipmentId: 1, createdAt: 1 });
