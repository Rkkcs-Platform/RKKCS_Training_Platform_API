import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ShipmentStatus } from '../common/enums';

export type ShipmentDocument = HydratedDocument<Shipment>;

@Schema({ timestamps: true, collection: 'shipments' })
export class Shipment {
  @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
  orderId: Types.ObjectId;

  @Prop({ required: true, trim: true, uppercase: true })
  shipmentCode: string;

  @Prop({ trim: true })
  carrier?: string;

  @Prop({
    required: true,
    enum: ShipmentStatus,
    default: ShipmentStatus.PENDING,
  })
  status: ShipmentStatus;

  @Prop({ trim: true })
  currentLocation?: string;

  @Prop({ trim: true })
  deliveryAddress?: string;

  /** Mock / future GPS — current package position */
  @Prop()
  currentLat?: number;

  @Prop()
  currentLng?: number;

  /** Mock / future GPS — delivery destination */
  @Prop()
  destLat?: number;

  @Prop()
  destLng?: number;

  @Prop({ trim: true })
  currentCityId?: string;

  @Prop({ trim: true })
  destCityId?: string;

  @Prop({ default: true })
  mapIsMock?: boolean;

  @Prop()
  eta?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ShipmentSchema = SchemaFactory.createForClass(Shipment);

ShipmentSchema.index({ orderId: 1 }, { unique: true });
ShipmentSchema.index({ shipmentCode: 1 }, { unique: true });
ShipmentSchema.index({ status: 1 });
