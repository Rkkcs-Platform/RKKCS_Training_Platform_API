import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import { Model, Types } from 'mongoose';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { ACTIVITY_ACTION } from '../common/constants/activity-action.constant';
import { ACTIVITY_TARGET } from '../common/constants/activity-target.constant';
import { APP_TIMEZONE } from '../common/constants/app.constant';
import { JP_SHIPMENT_NOTES } from '../common/data/order-fill/carriers';
import { ActorRole, OrderStatus, ShipmentStatus } from '../common/enums';
import { buildMapFromCityIds } from '../common/utils';
import { Order, OrderDocument } from '../schemas/order.schema';
import {
  ShipmentEvent,
  ShipmentEventDocument,
} from '../schemas/shipment-event.schema';
import { Shipment, ShipmentDocument } from '../schemas/shipment.schema';

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class OrderAgingService implements OnModuleInit {
  private readonly logger = new Logger(OrderAgingService.name);

  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Shipment.name)
    private readonly shipmentModel: Model<ShipmentDocument>,
    @InjectModel(ShipmentEvent.name)
    private readonly shipmentEventModel: Model<ShipmentEventDocument>,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  onModuleInit() {
    void this.ageOrders().catch((error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed startup order aging: ${message}`);
    });
  }

  @Cron('10 2 * * *', { timeZone: APP_TIMEZONE })
  async ageOrdersNightly() {
    try {
      const result = await this.ageOrders();
      this.activityLogsService.record({
        action: ACTIVITY_ACTION.ORDER_AGE_CRON,
        actorRole: ActorRole.SYSTEM,
        targetType: ACTIVITY_TARGET.SHOP,
        metadata: result,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed 2:10 AM order aging: ${message}`);
    }
  }

  /**
   * Orders stay pending on the day they are created.
   * After 24h they move to shipping. After 48h they are delivered.
   */
  async ageOrders(): Promise<{ shipping: number; delivered: number }> {
    const now = Date.now();
    const oneDayAgo = new Date(now - DAY_MS);
    const orders = await this.orderModel
      .find({
        status: { $nin: [OrderStatus.CANCELLED, OrderStatus.DELIVERED] },
        createdAt: { $lte: oneDayAgo },
      })
      .select('_id transactionCode createdAt status')
      .lean()
      .exec();

    if (!orders.length) {
      return { shipping: 0, delivered: 0 };
    }

    const shipments = await this.shipmentModel
      .find({ orderId: { $in: orders.map((order) => order._id) } })
      .select(
        '_id orderId status currentCityId destCityId deliveryAddress currentLocation',
      )
      .lean()
      .exec();
    const shipmentByOrder = new Map(
      shipments.map((shipment) => [shipment.orderId.toString(), shipment]),
    );

    const changes: Array<{
      orderId: Types.ObjectId;
      shipmentId: Types.ObjectId;
      orderStatus: OrderStatus;
      shipmentStatus: ShipmentStatus;
      patch: Record<string, unknown>;
      inTransitAt: Date;
      deliveredAt?: Date;
      inTransitLocation: string;
      deliveredLocation?: string;
    }> = [];

    for (const order of orders) {
      if (!order.createdAt) continue;
      const shipment = shipmentByOrder.get(order._id.toString());
      if (!shipment) continue;

      const ageMs = now - order.createdAt.getTime();
      const delivered = ageMs >= 2 * DAY_MS;
      const shipmentStatus = delivered
        ? ShipmentStatus.DELIVERED
        : ShipmentStatus.IN_TRANSIT;
      const orderStatus = delivered
        ? OrderStatus.DELIVERED
        : OrderStatus.SHIPPING;
      if (
        shipment.status === shipmentStatus &&
        order.status === orderStatus
      ) {
        continue;
      }

      const map = buildMapFromCityIds({
        seed: order.transactionCode,
        status: shipmentStatus,
        currentCityId: shipment.currentCityId,
        destCityId: shipment.destCityId,
      });
      const created = order.createdAt.getTime();
      changes.push({
        orderId: order._id,
        shipmentId: shipment._id,
        orderStatus,
        shipmentStatus,
        inTransitAt: new Date(created + DAY_MS),
        deliveredAt: delivered ? new Date(created + 2 * DAY_MS) : undefined,
        inTransitLocation: map.currentLocationText,
        deliveredLocation: shipment.deliveryAddress || map.destLabel,
        patch: {
          status: shipmentStatus,
          currentCityId: map.currentCityId,
          destCityId: map.destCityId,
          currentLat: map.currentLat,
          currentLng: map.currentLng,
          destLat: map.destLat,
          destLng: map.destLng,
          currentLocation: delivered
            ? shipment.deliveryAddress || map.destLabel
            : map.currentLocationText,
          eta: delivered ? new Date(created + 2 * DAY_MS) : new Date(created + 2 * DAY_MS),
        },
      });
    }

    if (!changes.length) {
      return { shipping: 0, delivered: 0 };
    }

    await Promise.all([
      this.orderModel.bulkWrite(
        changes.map((row) => ({
          updateOne: {
            filter: { _id: row.orderId },
            update: { $set: { status: row.orderStatus } },
          },
        })),
        { ordered: false },
      ),
      this.shipmentModel.bulkWrite(
        changes.map((row) => ({
          updateOne: {
            filter: { _id: row.shipmentId },
            update: { $set: row.patch },
          },
        })),
        { ordered: false },
      ),
    ]);

    await this.appendMissingEvents(changes);

    const deliveredCount = changes.filter(
      (row) => row.shipmentStatus === ShipmentStatus.DELIVERED,
    ).length;
    const shippingCount = changes.length - deliveredCount;
    this.logger.log(
      `Aged orders: ${shippingCount} shipping, ${deliveredCount} delivered`,
    );
    return { shipping: shippingCount, delivered: deliveredCount };
  }

  private async appendMissingEvents(
    changes: Array<{
      shipmentId: Types.ObjectId;
      shipmentStatus: ShipmentStatus;
      inTransitAt: Date;
      deliveredAt?: Date;
      inTransitLocation: string;
      deliveredLocation?: string;
    }>,
  ) {
    const existing = await this.shipmentEventModel
      .find({ shipmentId: { $in: changes.map((row) => row.shipmentId) } })
      .select('shipmentId status')
      .lean()
      .exec();
    const have = new Set(
      existing.map((event) => `${event.shipmentId.toString()}:${event.status}`),
    );
    const inserts: Array<{
      shipmentId: Types.ObjectId;
      status: ShipmentStatus;
      location: string;
      note: string;
      createdAt: Date;
    }> = [];

    for (const row of changes) {
      const key = row.shipmentId.toString();
      if (!have.has(`${key}:${ShipmentStatus.IN_TRANSIT}`)) {
        inserts.push({
          shipmentId: row.shipmentId,
          status: ShipmentStatus.IN_TRANSIT,
          location: row.inTransitLocation,
          note: JP_SHIPMENT_NOTES.in_transit,
          createdAt: row.inTransitAt,
        });
      }
      if (
        row.shipmentStatus === ShipmentStatus.DELIVERED &&
        row.deliveredAt &&
        row.deliveredLocation &&
        !have.has(`${key}:${ShipmentStatus.DELIVERED}`)
      ) {
        inserts.push({
          shipmentId: row.shipmentId,
          status: ShipmentStatus.DELIVERED,
          location: row.deliveredLocation,
          note: JP_SHIPMENT_NOTES.delivered,
          createdAt: row.deliveredAt,
        });
      }
    }

    if (inserts.length) {
      await this.shipmentEventModel.insertMany(inserts, { ordered: false });
    }
  }
}
