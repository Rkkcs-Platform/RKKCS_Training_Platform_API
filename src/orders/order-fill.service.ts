import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomInt } from 'crypto';
import { Model, Types } from 'mongoose';
import {
  FILL_ADDRESSES,
  formatJpAddress,
} from '../common/data/order-fill/addresses';
import {
  FILL_CARRIERS,
  FILL_PAYMENT_METHODS,
  JP_SHIPMENT_NOTES,
} from '../common/data/order-fill/carriers';
import { EMAIL_DOMAINS } from '../common/data/order-fill/emails';
import { FIRST_NAMES } from '../common/data/order-fill/first-names';
import { LAST_NAMES } from '../common/data/order-fill/last-names';
import { PHONE_PREFIXES } from '../common/data/order-fill/phones';
import { PaymentStatus, ShipmentStatus } from '../common/enums';
import { buildMapFromCityIds } from '../common/utils';
import { Customer, CustomerDocument } from '../schemas/customer.schema';
import { Order, OrderDocument } from '../schemas/order.schema';
import { OrderItem, OrderItemDocument } from '../schemas/order-item.schema';
import { Payment, PaymentDocument } from '../schemas/payment.schema';
import { ProductDocument } from '../schemas/product.schema';
import {
  ShipmentEvent,
  ShipmentEventDocument,
} from '../schemas/shipment-event.schema';
import { Shipment, ShipmentDocument } from '../schemas/shipment.schema';
import { ShopsService } from '../shops/shops.service';
import { ProductsService } from './products.service';

export interface FillShopResult {
  shopId: string;
  shopCode: string;
  productsCreated: number;
  productsExisting: number;
  customersUpdated: number;
  ordersProductUpdated: number;
  shipmentsUpdated: number;
  paymentsUpdated: number;
  ordersScanned: number;
  ordersFailed: number;
}

type FillLineItem = {
  orderId: Types.ObjectId;
  productId: Types.ObjectId;
  productName: string;
  productCode: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

type ProductWrite = {
  orderId: Types.ObjectId;
  previousAmount: number;
  amount: number;
  customerId: Types.ObjectId;
  transactionCode: string;
  items: FillLineItem[];
};

const SHOP_CONCURRENCY = 3;

@Injectable()
export class OrderFillService {
  private readonly logger = new Logger(OrderFillService.name);

  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Customer.name)
    private readonly customerModel: Model<CustomerDocument>,
    @InjectModel(OrderItem.name)
    private readonly orderItemModel: Model<OrderItemDocument>,
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<PaymentDocument>,
    @InjectModel(Shipment.name)
    private readonly shipmentModel: Model<ShipmentDocument>,
    @InjectModel(ShipmentEvent.name)
    private readonly shipmentEventModel: Model<ShipmentEventDocument>,
    private readonly shopsService: ShopsService,
    private readonly productsService: ProductsService,
  ) {}

  async fillShop(shopId: string): Promise<FillShopResult> {
    const shop = await this.shopsService.findById(shopId);
    return this.fillShopDoc(shop._id, shop.shopCode);
  }

  async fillAllActiveShops(): Promise<{
    shopsProcessed: number;
    results: FillShopResult[];
  }> {
    const shops = await this.shopsService.findActiveShops();
    const results = await this.mapPool(shops, SHOP_CONCURRENCY, (shop) =>
      this.fillShopDoc(shop._id, shop.shopCode),
    );
    return { shopsProcessed: results.length, results };
  }

  private async fillShopDoc(
    oid: Types.ObjectId,
    shopCode: string,
  ): Promise<FillShopResult> {
    const catalog = await this.productsService.ensureCatalogForShop(oid);
    await this.productsService.promoteCatalogAsDefault(oid);
    const [assignable, stubProductIds] = await Promise.all([
      this.productsService.listAssignableProducts(oid),
      this.productsService.listStubProductIds(oid),
    ]);
    const stubIdSet = new Set(stubProductIds);

    const orders = await this.orderModel
      .find({ shopId: oid })
      .select('_id customerId amount transactionCode orderCode')
      .lean()
      .exec();

    if (!orders.length) {
      return {
        shopId: oid.toString(),
        shopCode,
        productsCreated: catalog.created,
        productsExisting: catalog.existing,
        customersUpdated: 0,
        ordersProductUpdated: 0,
        shipmentsUpdated: 0,
        paymentsUpdated: 0,
        ordersScanned: 0,
        ordersFailed: 0,
      };
    }

    const orderIds = orders.map((order) => order._id);
    const customerIds = [
      ...new Set(orders.map((order) => order.customerId.toString())),
    ].map((id) => new Types.ObjectId(id));

    const [customers, items, shipments, payments] = await Promise.all([
      this.customerModel.find({ _id: { $in: customerIds } }).lean().exec(),
      this.orderItemModel
        .find({ orderId: { $in: orderIds } })
        .select('orderId productId productCode productName quantity')
        .lean()
        .exec(),
      this.shipmentModel
        .find({ orderId: { $in: orderIds } })
        .select(
          '_id orderId carrier deliveryAddress status currentLocation shipmentCode currentCityId destCityId',
        )
        .lean()
        .exec(),
      this.paymentModel
        .find({ orderId: { $in: orderIds } })
        .select('_id orderId method')
        .lean()
        .exec(),
    ]);

    const customerById = new Map(
      customers.map((customer) => [customer._id.toString(), customer]),
    );
    const itemsByOrder = new Map<string, typeof items>();
    for (const item of items) {
      const key = item.orderId.toString();
      const list = itemsByOrder.get(key);
      if (list) list.push(item);
      else itemsByOrder.set(key, [item]);
    }
    const orderById = new Map(
      orders.map((order) => [order._id.toString(), order]),
    );

    const customerOps: Array<{
      updateOne: {
        filter: { _id: Types.ObjectId };
        update: { $set: Record<string, string> };
      };
    }> = [];
    const seenCustomers = new Set<string>();

    for (const order of orders) {
      const customerId = order.customerId.toString();
      if (seenCustomers.has(customerId)) continue;
      const customer = customerById.get(customerId);
      if (!customer) continue;

      const patch = this.buildCustomerPatch(customer);
      if (!patch) continue;

      seenCustomers.add(customerId);
      customerOps.push({
        updateOne: {
          filter: { _id: customer._id },
          update: { $set: patch },
        },
      });
    }

    const productWrites: ProductWrite[] = [];

    if (assignable.length) {
      for (const order of orders) {
        const orderItems = itemsByOrder.get(order._id.toString()) ?? [];
        const needsFill =
          !orderItems.length ||
          orderItems.some((item) => this.isStubProductItem(item, stubIdSet));
        if (!needsFill) continue;

        const built = this.buildLineItems(
          order._id,
          assignable,
          orderItems[0]?.quantity || 1,
        );
        productWrites.push({
          orderId: order._id,
          previousAmount: order.amount,
          amount: built.amount,
          customerId: order.customerId,
          transactionCode: order.transactionCode,
          items: built.items,
        });
      }
    }

    const replaceIds = productWrites.map((row) => row.orderId);
    const shipmentWrites = this.buildShipmentWrites(shipments, orderById);
    const paymentMethodOps = payments.flatMap((payment) => {
      if (!this.isStubPaymentMethod(payment.method)) return [];
      return [
        {
          updateOne: {
            filter: { _id: payment._id },
            update: { $set: { method: this.pick(FILL_PAYMENT_METHODS) } },
          },
        },
      ];
    });

    await Promise.all([
      customerOps.length
        ? this.customerModel.bulkWrite(customerOps, { ordered: false })
        : Promise.resolve(),
      this.applyProductWrites(productWrites, replaceIds),
    ]);

    const shipmentsUpdated = await this.applyShipmentWrites(shipmentWrites);

    if (paymentMethodOps.length) {
      await this.paymentModel.bulkWrite(paymentMethodOps, { ordered: false });
    }

    const result: FillShopResult = {
      shopId: oid.toString(),
      shopCode,
      productsCreated: catalog.created,
      productsExisting: catalog.existing,
      customersUpdated: customerOps.length,
      ordersProductUpdated: productWrites.length,
      shipmentsUpdated,
      paymentsUpdated: paymentMethodOps.length,
      ordersScanned: orders.length,
      ordersFailed: 0,
    };

    this.logger.log(
      `Filled shop ${shopCode}: catalog +${catalog.created}, customers ${result.customersUpdated}, products ${result.ordersProductUpdated}/${orders.length}, shipments ${result.shipmentsUpdated}, payments ${result.paymentsUpdated}`,
    );

    return result;
  }

  private buildLineItems(
    orderId: Types.ObjectId,
    assignable: ProductDocument[],
    existingQty: number,
  ): { items: FillLineItem[]; amount: number } {
    const count = Math.min(assignable.length, randomInt(2, 4));
    const products = this.pickDistinct(assignable, Math.max(1, count));
    const items = products.map((product, index) => {
      const quantity =
        index === 0 ? Math.max(1, existingQty) : randomInt(1, 3);
      const unitPrice = product.price;
      return {
        orderId,
        productId: product._id,
        productName: product.name,
        productCode: product.productCode,
        quantity,
        unitPrice,
        lineTotal: unitPrice * quantity,
      };
    });
    const amount = items.reduce((sum, item) => sum + item.lineTotal, 0);
    return { items, amount };
  }

  private async applyProductWrites(
    productWrites: ProductWrite[],
    replaceIds: Types.ObjectId[],
  ) {
    if (!productWrites.length) return;

    const spentDelta = new Map<string, number>();
    for (const row of productWrites) {
      const key = row.customerId.toString();
      spentDelta.set(
        key,
        (spentDelta.get(key) ?? 0) + (row.amount - row.previousAmount),
      );
    }

    const payments = await this.paymentModel
      .find({ orderId: { $in: replaceIds } })
      .select('_id orderId paymentCode status')
      .lean()
      .exec();
    const paymentByOrder = new Map(
      payments.map((payment) => [payment.orderId.toString(), payment]),
    );
    const validStatuses = new Set<string>(Object.values(PaymentStatus));

    const orderOps = productWrites.map((row) => ({
      updateOne: {
        filter: { _id: row.orderId },
        update: { $set: { amount: row.amount } },
      },
    }));
    const paymentOps = productWrites.flatMap((row) => {
      const payment = paymentByOrder.get(row.orderId.toString());
      if (!payment) return [];
      const patch: Record<string, unknown> = { amount: row.amount };
      if (!payment.paymentCode?.trim()) {
        patch.paymentCode = `PAY-${row.transactionCode}`;
      }
      if (!validStatuses.has(String(payment.status))) {
        patch.status = PaymentStatus.PAID;
      }
      return [
        {
          updateOne: {
            filter: { _id: payment._id },
            update: { $set: patch },
          },
        },
      ];
    });
    const spentOps = [...spentDelta.entries()].map(([customerId, delta]) => ({
      updateOne: {
        filter: { _id: new Types.ObjectId(customerId) },
        update: [
          {
            $set: {
              totalSpent: {
                $max: [0, { $add: ['$totalSpent', delta] }],
              },
            },
          },
        ],
      },
    }));

    await this.orderItemModel.deleteMany({ orderId: { $in: replaceIds } }).exec();
    await this.orderItemModel.insertMany(
      productWrites.flatMap((row) => row.items),
      { ordered: false },
    );

    await Promise.all([
      orderOps.length
        ? this.orderModel.bulkWrite(orderOps, { ordered: false })
        : Promise.resolve(),
      paymentOps.length
        ? this.paymentModel.bulkWrite(paymentOps, { ordered: false })
        : Promise.resolve(),
      spentOps.length
        ? this.customerModel.bulkWrite(spentOps, { ordered: false })
        : Promise.resolve(),
    ]);
  }

  private buildShipmentWrites(
    shipments: Array<{
      _id: Types.ObjectId;
      orderId: Types.ObjectId;
      carrier?: string;
      deliveryAddress?: string;
      status: string;
      currentLocation?: string;
      shipmentCode: string;
      currentCityId?: string;
      destCityId?: string;
    }>,
    orderById: Map<
      string,
      { _id: Types.ObjectId; transactionCode: string }
    >,
  ) {
    return shipments.flatMap((shipment) => {
      if (!this.needsShipmentFill(shipment)) return [];
      const order = orderById.get(shipment.orderId.toString());
      const seed = order?.transactionCode || shipment.shipmentCode;
      const address = this.pick(FILL_ADDRESSES);
      const carrier = this.pick(FILL_CARRIERS);
      const map = buildMapFromCityIds({
        seed,
        status: shipment.status,
        currentCityId: carrier.currentCityId,
        destCityId: address.cityId,
      });
      const eta = new Date();
      eta.setDate(
        eta.getDate() +
          (shipment.status === ShipmentStatus.DELIVERED ? 0 : randomInt(1, 4)),
      );
      const currentLocation =
        shipment.status === ShipmentStatus.PENDING
          ? carrier.depot
          : map.currentLocationText;

      return [
        {
          shipmentId: shipment._id,
          status: shipment.status,
          currentLocation,
          depot: carrier.depot,
          deliveryAddress: formatJpAddress(address),
          patch: {
            carrier: carrier.name,
            deliveryAddress: formatJpAddress(address),
            currentLocation,
            currentCityId: map.currentCityId,
            destCityId: map.destCityId,
            currentLat: map.currentLat,
            currentLng: map.currentLng,
            destLat: map.destLat,
            destLng: map.destLng,
            mapIsMock: true,
            eta,
          },
        },
      ];
    });
  }

  private async applyShipmentWrites(
    writes: Array<{
      shipmentId: Types.ObjectId;
      status: string;
      currentLocation: string;
      depot: string;
      deliveryAddress: string;
      patch: Record<string, unknown>;
    }>,
  ): Promise<number> {
    if (!writes.length) return 0;

    const shipmentIds = writes.map((row) => row.shipmentId);
    const events = await this.shipmentEventModel
      .find({ shipmentId: { $in: shipmentIds } })
      .select('_id shipmentId status')
      .lean()
      .exec();
    const eventsByShipment = new Map<string, typeof events>();
    for (const event of events) {
      const key = event.shipmentId.toString();
      const list = eventsByShipment.get(key);
      if (list) list.push(event);
      else eventsByShipment.set(key, [event]);
    }

    const shipmentOps = writes.map((row) => ({
      updateOne: {
        filter: { _id: row.shipmentId },
        update: { $set: row.patch },
      },
    }));
    const eventOps: Array<{
      updateOne: {
        filter: { _id: Types.ObjectId };
        update: { $set: Record<string, string> };
      };
    }> = [];
    const eventInserts: Array<{
      shipmentId: Types.ObjectId;
      status: ShipmentStatus;
      location: string;
      note: string;
    }> = [];

    for (const row of writes) {
      const existing = eventsByShipment.get(row.shipmentId.toString()) ?? [];
      if (existing.length) {
        for (const event of existing) {
          eventOps.push({
            updateOne: {
              filter: { _id: event._id },
              update: {
                $set: {
                  location: this.locationForStatus(
                    event.status,
                    row.depot,
                    row.currentLocation,
                    row.deliveryAddress,
                  ),
                  note: this.noteForEventStatus(event.status),
                },
              },
            },
          });
        }
        continue;
      }

      eventInserts.push({
        shipmentId: row.shipmentId,
        status: ShipmentStatus.PENDING,
        location: row.depot,
        note: JP_SHIPMENT_NOTES.created,
      });
      if (
        row.status === ShipmentStatus.IN_TRANSIT ||
        row.status === ShipmentStatus.DELIVERED
      ) {
        eventInserts.push({
          shipmentId: row.shipmentId,
          status: ShipmentStatus.IN_TRANSIT,
          location: row.currentLocation,
          note: JP_SHIPMENT_NOTES.in_transit,
        });
      }
      if (row.status === ShipmentStatus.DELIVERED) {
        eventInserts.push({
          shipmentId: row.shipmentId,
          status: ShipmentStatus.DELIVERED,
          location: row.deliveryAddress,
          note: JP_SHIPMENT_NOTES.delivered,
        });
      }
    }

    await Promise.all([
      this.shipmentModel.bulkWrite(shipmentOps, { ordered: false }),
      eventOps.length
        ? this.shipmentEventModel.bulkWrite(eventOps, { ordered: false })
        : Promise.resolve(),
    ]);
    if (eventInserts.length) {
      await this.shipmentEventModel.insertMany(eventInserts, { ordered: false });
    }

    return writes.length;
  }

  private needsShipmentFill(shipment: {
    carrier?: string;
    deliveryAddress?: string;
  }): boolean {
    const carrier = (shipment.carrier || '').trim();
    const address = shipment.deliveryAddress || '';
    return (
      !carrier ||
      /^rkkcs express$/i.test(carrier) ||
      !address.includes('〒') ||
      address.includes('(mock)') ||
      address.includes('TP.HCM')
    );
  }

  private isStubPaymentMethod(method?: string): boolean {
    const raw = (method || '').trim().toLowerCase();
    return !raw || raw === 'system' || raw === 'cash' || raw === 'card';
  }

  private noteForEventStatus(status: string): string {
    if (status === ShipmentStatus.PENDING) return JP_SHIPMENT_NOTES.created;
    return JP_SHIPMENT_NOTES[status] ?? JP_SHIPMENT_NOTES.in_transit;
  }

  private locationForStatus(
    status: string,
    depot: string,
    currentLocation: string,
    deliveryAddress: string,
  ): string {
    if (status === ShipmentStatus.DELIVERED) return deliveryAddress;
    if (status === ShipmentStatus.IN_TRANSIT) return currentLocation;
    return depot;
  }

  private buildCustomerPatch(customer: {
    fullName?: string;
    phone?: string;
    email?: string;
  }): Record<string, string> | null {
    const patch: Record<string, string> = {};
    let emailLocal: string | undefined;

    if (this.isPlaceholderName(customer.fullName)) {
      const parts = this.randomNameParts();
      patch.fullName = parts.fullName;
      emailLocal = parts.emailLocal;
    }
    if (!customer.phone?.trim()) {
      patch.phone = this.randomPhone();
    }
    if (!customer.email?.trim()) {
      patch.email = this.buildEmail(
        emailLocal ?? this.romajiLocalFromName(patch.fullName || customer.fullName || ''),
      );
    }

    return Object.keys(patch).length ? patch : null;
  }

  private isStubProductItem(
    item: {
      productId: Types.ObjectId;
      productCode?: string;
      productName?: string;
    },
    stubProductIds: Set<string>,
  ): boolean {
    const name = (item.productName || '').trim();
    return (
      item.productCode === 'DEFAULT' ||
      /^sản phẩm mặc định$/i.test(name) ||
      stubProductIds.has(item.productId.toString())
    );
  }

  private randomNameParts() {
    const last = this.pick(LAST_NAMES);
    const first = this.pick(FIRST_NAMES);
    return {
      fullName: `${last.kanji} ${first.kanji}`,
      emailLocal: `${first.romaji}.${last.romaji}`,
    };
  }

  private randomPhone(): string {
    const prefix = this.pick(PHONE_PREFIXES);
    const rest = String(randomInt(0, 100_000_000)).padStart(8, '0');
    return `${prefix}-${rest.slice(0, 4)}-${rest.slice(4)}`;
  }

  private buildEmail(local?: string): string {
    const base = local || `user${randomInt(10, 1000)}`;
    const n = randomInt(10, 100);
    return `${base}${n}@${this.pick(EMAIL_DOMAINS)}`;
  }

  private romajiLocalFromName(fullName: string): string | undefined {
    const tokens = fullName.trim().split(/\s+/);
    const lastKanji = tokens[0];
    const firstKanji = tokens.slice(1).join('');
    const last = LAST_NAMES.find((item) => item.kanji === lastKanji);
    const first = FIRST_NAMES.find((item) => item.kanji === firstKanji);
    if (last && first) {
      return `${first.romaji}.${last.romaji}`;
    }
    return undefined;
  }

  private isPlaceholderName(name?: string): boolean {
    const raw = (name || '').trim();
    return (
      !raw ||
      /^chưa cập nhật/i.test(raw) ||
      /^customer\s+/i.test(raw)
    );
  }

  private pick<T>(items: readonly T[]): T {
    if (!items.length) {
      throw new Error('Cannot pick from an empty list');
    }
    return items[randomInt(items.length)] as T;
  }

  private pickDistinct<T>(items: readonly T[], count: number): T[] {
    const n = Math.min(count, items.length);
    const copy = items.slice();
    const picked: T[] = [];
    for (let i = 0; i < n; i += 1) {
      const index = randomInt(copy.length);
      picked.push(copy.splice(index, 1)[0] as T);
    }
    return picked;
  }

  private async mapPool<T, R>(
    items: T[],
    concurrency: number,
    fn: (item: T) => Promise<R>,
  ): Promise<R[]> {
    if (!items.length) return [];
    const results: R[] = new Array(items.length);
    let next = 0;
    const worker = async () => {
      while (true) {
        const index = next;
        next += 1;
        if (index >= items.length) return;
        results[index] = await fn(items[index] as T);
      }
    };
    const size = Math.min(concurrency, items.length);
    await Promise.all(Array.from({ length: size }, () => worker()));
    return results;
  }
}
