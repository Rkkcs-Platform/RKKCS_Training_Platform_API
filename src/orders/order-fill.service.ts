import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomInt } from 'crypto';
import { Model, Types } from 'mongoose';
import { EMAIL_DOMAINS } from '../common/data/order-fill/emails';
import { FIRST_NAMES } from '../common/data/order-fill/first-names';
import { LAST_NAMES } from '../common/data/order-fill/last-names';
import { PHONE_PREFIXES } from '../common/data/order-fill/phones';
import { PaymentStatus } from '../common/enums';
import { Customer, CustomerDocument } from '../schemas/customer.schema';
import { Order, OrderDocument } from '../schemas/order.schema';
import { OrderItem, OrderItemDocument } from '../schemas/order-item.schema';
import { Payment, PaymentDocument } from '../schemas/payment.schema';
import { ShopsService } from '../shops/shops.service';
import { ProductsService } from './products.service';

export interface FillShopResult {
  shopId: string;
  shopCode: string;
  productsCreated: number;
  productsExisting: number;
  customersUpdated: number;
  ordersProductUpdated: number;
  ordersScanned: number;
  ordersFailed: number;
}

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
        ordersScanned: 0,
        ordersFailed: 0,
      };
    }

    const orderIds = orders.map((order) => order._id);
    const customerIds = [
      ...new Set(orders.map((order) => order.customerId.toString())),
    ].map((id) => new Types.ObjectId(id));

    const [customers, items] = await Promise.all([
      this.customerModel.find({ _id: { $in: customerIds } }).lean().exec(),
      this.orderItemModel
        .find({ orderId: { $in: orderIds } })
        .select('orderId productId productCode productName quantity')
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

    const productWrites: Array<{
      orderId: Types.ObjectId;
      previousAmount: number;
      amount: number;
      customerId: Types.ObjectId;
      transactionCode: string;
      item: {
        orderId: Types.ObjectId;
        productId: Types.ObjectId;
        productName: string;
        productCode: string;
        quantity: number;
        unitPrice: number;
        lineTotal: number;
      };
    }> = [];

    if (assignable.length) {
      for (const order of orders) {
        const orderItems = itemsByOrder.get(order._id.toString()) ?? [];
        const needsFill =
          !orderItems.length ||
          orderItems.some((item) => this.isStubProductItem(item, stubIdSet));
        if (!needsFill) continue;

        const product = this.pick(assignable);
        const quantity = orderItems[0]?.quantity || 1;
        const unitPrice = product.price;
        const lineTotal = unitPrice * quantity;
        productWrites.push({
          orderId: order._id,
          previousAmount: order.amount,
          amount: lineTotal,
          customerId: order.customerId,
          transactionCode: order.transactionCode,
          item: {
            orderId: order._id,
            productId: product._id,
            productName: product.name,
            productCode: product.productCode,
            quantity,
            unitPrice,
            lineTotal,
          },
        });
      }
    }

    const replaceIds = productWrites.map((row) => row.orderId);

    await Promise.all([
      customerOps.length
        ? this.customerModel.bulkWrite(customerOps, { ordered: false })
        : Promise.resolve(),
      this.applyProductWrites(productWrites, replaceIds),
    ]);

    const result: FillShopResult = {
      shopId: oid.toString(),
      shopCode,
      productsCreated: catalog.created,
      productsExisting: catalog.existing,
      customersUpdated: customerOps.length,
      ordersProductUpdated: productWrites.length,
      ordersScanned: orders.length,
      ordersFailed: 0,
    };

    this.logger.log(
      `Filled shop ${shopCode}: catalog +${catalog.created}, customers ${result.customersUpdated}, products ${result.ordersProductUpdated}/${orders.length}`,
    );

    return result;
  }

  private async applyProductWrites(
    productWrites: Array<{
      orderId: Types.ObjectId;
      previousAmount: number;
      amount: number;
      customerId: Types.ObjectId;
      transactionCode: string;
      item: {
        orderId: Types.ObjectId;
        productId: Types.ObjectId;
        productName: string;
        productCode: string;
        quantity: number;
        unitPrice: number;
        lineTotal: number;
      };
    }>,
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
      productWrites.map((row) => row.item),
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
