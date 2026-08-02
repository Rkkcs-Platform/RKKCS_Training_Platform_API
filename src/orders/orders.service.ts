import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { OrderStatus, ShipmentStatus } from '../common/enums';
import {
  buildMapFromCityIds,
  buildMockShipmentMap,
  buildPaginationMeta,
  findMockCity,
  getMockMapRegion,
  parsePagination,
} from '../common/utils';
import { Customer, CustomerDocument } from '../schemas/customer.schema';
import { Order, OrderDocument } from '../schemas/order.schema';
import { OrderItem, OrderItemDocument } from '../schemas/order-item.schema';
import { Payment, PaymentDocument } from '../schemas/payment.schema';
import {
  ShipmentEvent,
  ShipmentEventDocument,
} from '../schemas/shipment-event.schema';
import { Shipment, ShipmentDocument } from '../schemas/shipment.schema';
import { UserDocument } from '../schemas/user.schema';
import { ShopsService } from '../shops/shops.service';
import { UpdateOrderDto } from './dto/update-order.dto';
import { GeocodeService } from './geocode.service';
import { ProductsService } from './products.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<PaymentDocument>,
    @InjectModel(Shipment.name)
    private readonly shipmentModel: Model<ShipmentDocument>,
    @InjectModel(Customer.name)
    private readonly customerModel: Model<CustomerDocument>,
    @InjectModel(OrderItem.name)
    private readonly orderItemModel: Model<OrderItemDocument>,
    @InjectModel(ShipmentEvent.name)
    private readonly shipmentEventModel: Model<ShipmentEventDocument>,
    private readonly shopsService: ShopsService,
    private readonly productsService: ProductsService,
    private readonly geocodeService: GeocodeService,
  ) {}

  async getAdminOrders(query: PaginationQueryDto) {
    const { page, limit, skip } = parsePagination(query.page, query.limit);
    const [items, total] = await Promise.all([
      this.orderModel
        .find()
        .populate('customerId', 'customerCode fullName')
        .populate('shopId', 'shopCode shopName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.orderModel.countDocuments().exec(),
    ]);

    return {
      items: items.map((item) => this.toAdminListItem(item)),
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async getAdminOrderById(orderId: string) {
    return this.getOrderDetail(orderId);
  }

  async getShopOwnerOrders(user: UserDocument, query: PaginationQueryDto) {
    const shopId = await this.shopsService.resolveShopIdForUser(user);
    const { page, limit, skip } = parsePagination(query.page, query.limit);
    const filter = { shopId };

    const [items, total] = await Promise.all([
      this.orderModel
        .find(filter)
        .populate('customerId', 'customerCode fullName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.orderModel.countDocuments(filter).exec(),
    ]);

    return {
      items: items.map((item) => this.toListItem(item)),
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async getShopOwnerOrderById(user: UserDocument, orderId: string) {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('Invalid order ID');
    }

    const shopId = await this.shopsService.resolveShopIdForUser(user);
    const order = await this.orderModel
      .findOne({ _id: orderId, shopId })
      .populate('customerId', 'customerCode fullName phone email totalSpent')
      .exec();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.toDetail(order);
  }

  async updateShopOwnerOrder(
    user: UserDocument,
    orderId: string,
    dto: UpdateOrderDto,
  ) {
    const shopId = await this.shopsService.resolveShopIdForUser(user);
    return this.updateOrderForShop(orderId, shopId, dto);
  }

  async updateAdminOrder(orderId: string, dto: UpdateOrderDto) {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('Invalid order ID');
    }

    const order = await this.orderModel.findById(orderId).exec();
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.updateOrderForShop(orderId, order.shopId, dto);
  }

  private async updateOrderForShop(
    orderId: string,
    shopId: Types.ObjectId,
    dto: UpdateOrderDto,
  ) {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('Invalid order ID');
    }

    const order = await this.orderModel
      .findOne({ _id: orderId, shopId })
      .exec();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (dto.status !== undefined) {
      order.status = dto.status;
    }

    if (dto.customer) {
      const customer = await this.customerModel
        .findOne({ _id: order.customerId, shopId })
        .exec();
      if (!customer) {
        throw new NotFoundException('Customer not found');
      }

      if (dto.customer.fullName !== undefined) {
        const name = dto.customer.fullName.trim();
        customer.fullName = name || 'Chưa cập nhật';
      }
      if (dto.customer.phone !== undefined) {
        customer.phone = dto.customer.phone.trim();
      }
      if (dto.customer.email !== undefined) {
        customer.email = dto.customer.email.trim().toLowerCase();
      }
      await customer.save();
    }

    if (dto.shipment) {
      let shipment = await this.shipmentModel
        .findOne({ orderId: order._id })
        .exec();

      const isNewShipment = !shipment;
      if (!shipment) {
        const map = buildMockShipmentMap(
          order.transactionCode,
          ShipmentStatus.PENDING,
        );
        shipment = await this.shipmentModel.create({
          orderId: order._id,
          shipmentCode: `SHP-${order.transactionCode}`,
          carrier: 'RKKCS Express',
          status: ShipmentStatus.PENDING,
          currentLocation: map.currentLocationText,
          deliveryAddress: map.deliveryAddressText,
          currentLat: map.currentLat,
          currentLng: map.currentLng,
          destLat: map.destLat,
          destLng: map.destLng,
          currentCityId: map.currentCityId,
          destCityId: map.destCityId,
          mapIsMock: true,
        });
      }

      const previousStatus = shipment.status;
      const previousLocation = shipment.currentLocation;

      if (dto.shipment.status !== undefined) {
        shipment.status = dto.shipment.status;
        if (
          dto.status === undefined &&
          dto.shipment.status === ShipmentStatus.IN_TRANSIT
        ) {
          order.status = OrderStatus.SHIPPING;
        }
        if (
          dto.status === undefined &&
          dto.shipment.status === ShipmentStatus.DELIVERED
        ) {
          order.status = OrderStatus.DELIVERED;
        }
      }
      if (dto.shipment.carrier !== undefined) {
        shipment.carrier = dto.shipment.carrier;
      }
      if (dto.shipment.currentLocation !== undefined) {
        shipment.currentLocation = dto.shipment.currentLocation;
      }
      if (dto.shipment.deliveryAddress !== undefined) {
        shipment.deliveryAddress = dto.shipment.deliveryAddress;
      }
      if (dto.shipment.eta !== undefined) {
        shipment.eta = new Date(dto.shipment.eta);
      }

      if (dto.shipment.currentCityId !== undefined) {
        if (!findMockCity(dto.shipment.currentCityId)) {
          throw new BadRequestException(
            `Unknown currentCityId: ${dto.shipment.currentCityId}`,
          );
        }
        shipment.currentCityId = dto.shipment.currentCityId;
      }
      if (dto.shipment.destCityId !== undefined) {
        if (!findMockCity(dto.shipment.destCityId)) {
          throw new BadRequestException(
            `Unknown destCityId: ${dto.shipment.destCityId}`,
          );
        }
        shipment.destCityId = dto.shipment.destCityId;
      }

      // Base pins from city catalog, then override with street geocode when provided
      const map = buildMapFromCityIds({
        seed: order.transactionCode,
        status: shipment.status,
        currentCityId: shipment.currentCityId,
        destCityId: shipment.destCityId,
      });
      shipment.currentCityId = map.currentCityId;
      shipment.destCityId = map.destCityId;
      shipment.currentLat = map.currentLat;
      shipment.currentLng = map.currentLng;
      shipment.destLat = map.destLat;
      shipment.destLng = map.destLng;
      shipment.mapIsMock = true;

      if (!shipment.currentLocation) {
        shipment.currentLocation = map.currentLocationText;
      }
      if (!shipment.deliveryAddress) {
        shipment.deliveryAddress = map.deliveryAddressText;
      }

      const country = getMockMapRegion() === 'vietnam' ? 'vn' : 'jp';

      if (dto.shipment.currentLocation?.trim()) {
        shipment.currentLocation = dto.shipment.currentLocation.trim();
        if (this.looksLikeStreetAddress(shipment.currentLocation)) {
          const geo = await this.geocodeService.geocodeAddress(
            shipment.currentLocation,
            country,
          );
          if (geo) {
            shipment.currentLat = geo.lat;
            shipment.currentLng = geo.lng;
            shipment.mapIsMock = false;
          }
        }
      }

      if (dto.shipment.deliveryAddress?.trim()) {
        shipment.deliveryAddress = dto.shipment.deliveryAddress.trim();
        if (this.looksLikeStreetAddress(shipment.deliveryAddress)) {
          const geo = await this.geocodeService.geocodeAddress(
            shipment.deliveryAddress,
            country,
          );
          if (geo) {
            shipment.destLat = geo.lat;
            shipment.destLng = geo.lng;
            shipment.mapIsMock = false;
          }
        }
      }

      await shipment.save();

      const statusChanged =
        isNewShipment || previousStatus !== shipment.status;
      const locationChanged =
        isNewShipment ||
        (dto.shipment.currentLocation !== undefined &&
          previousLocation !== shipment.currentLocation);
      const hasNote = Boolean(dto.shipment.note?.trim());

      if (statusChanged || locationChanged || hasNote) {
        await this.recordShipmentEvent({
          shipmentId: shipment._id,
          status: shipment.status,
          location: shipment.currentLocation,
          note:
            dto.shipment.note?.trim() ||
            (isNewShipment
              ? 'Vận đơn được tạo'
              : statusChanged
                ? this.defaultNoteForStatus(shipment.status)
                : 'Cập nhật vị trí vận chuyển'),
        });
      } else {
        await this.ensureShipmentEvents(shipment);
      }
    }

    if (dto.items) {
      await this.replaceOrderItems(order, shopId, dto.items);
    }

    await order.save();

    const refreshed = await this.orderModel
      .findById(order._id)
      .populate('customerId', 'customerCode fullName phone email totalSpent')
      .populate('shopId', 'shopCode shopName')
      .exec();

    if (!refreshed) {
      throw new NotFoundException('Order not found');
    }

    return this.toDetail(refreshed);
  }

  async ensureDefaultOrderItem(order: OrderDocument) {
    const existing = await this.orderItemModel
      .countDocuments({ orderId: order._id })
      .exec();
    if (existing > 0) return;

    const product = await this.productsService.getOrCreateDefaultProduct(
      order.shopId,
    );
    const quantity = 1;
    const unitPrice = order.amount || product.price;
    await this.orderItemModel.create({
      orderId: order._id,
      productId: product._id,
      productName: product.name,
      productCode: product.productCode,
      quantity,
      unitPrice,
      lineTotal: unitPrice * quantity,
    });
  }

  private async replaceOrderItems(
    order: OrderDocument,
    shopId: Types.ObjectId,
    items: Array<{ productId: string; quantity: number }>,
  ) {
    if (!items.length) {
      throw new BadRequestException('Order must have at least one product');
    }

    const resolved: Array<{
      orderId: Types.ObjectId;
      productId: Types.ObjectId;
      productName: string;
      productCode: string;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
    }> = [];
    for (const item of items) {
      const product = await this.productsService.findActiveByIdForShop(
        item.productId,
        shopId,
      );
      const quantity = item.quantity;
      const unitPrice = product.price;
      resolved.push({
        orderId: order._id,
        productId: product._id,
        productName: product.name,
        productCode: product.productCode,
        quantity,
        unitPrice,
        lineTotal: unitPrice * quantity,
      });
    }

    await this.orderItemModel.deleteMany({ orderId: order._id }).exec();
    await this.orderItemModel.insertMany(resolved);

    const amount = resolved.reduce((sum, item) => sum + item.lineTotal, 0);
    const previousAmount = order.amount;
    order.amount = amount;

    const customer = await this.customerModel.findById(order.customerId).exec();
    if (customer) {
      customer.totalSpent = Math.max(
        0,
        customer.totalSpent - previousAmount + amount,
      );
      await customer.save();
    }

    const payment = await this.paymentModel
      .findOne({ orderId: order._id })
      .exec();
    if (payment) {
      payment.amount = amount;
      await payment.save();
    }
  }

  async getShopDashboard(user: UserDocument) {
    const shopId = await this.shopsService.resolveShopIdForUser(user);
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const trendStart = new Date(startOfToday);
    trendStart.setDate(trendStart.getDate() - 6);

    const orderIds = await this.orderModel
      .find({ shopId })
      .select('_id')
      .exec();
    const ids = orderIds.map((order) => order._id);

    const [
      ordersTotal,
      customersTotal,
      revenueAgg,
      ordersToday,
      ordersYesterday,
      pendingShipments,
      deliveredShipments,
      cancelledOrders,
      recentOrders,
      trendOrders,
    ] = await Promise.all([
      this.orderModel.countDocuments({ shopId }).exec(),
      this.customerModel.countDocuments({ shopId }).exec(),
      this.orderModel
        .aggregate<{ total: number }>([
          { $match: { shopId } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ])
        .exec(),
      this.orderModel
        .countDocuments({ shopId, createdAt: { $gte: startOfToday } })
        .exec(),
      this.orderModel
        .countDocuments({
          shopId,
          createdAt: { $gte: startOfYesterday, $lt: startOfToday },
        })
        .exec(),
      this.shipmentModel
        .countDocuments({
          orderId: { $in: ids },
          status: { $in: [ShipmentStatus.PENDING, ShipmentStatus.IN_TRANSIT] },
        })
        .exec(),
      this.shipmentModel
        .countDocuments({
          orderId: { $in: ids },
          status: ShipmentStatus.DELIVERED,
        })
        .exec(),
      this.orderModel
        .countDocuments({ shopId, status: OrderStatus.CANCELLED })
        .exec(),
      this.orderModel
        .find({ shopId })
        .populate('customerId', 'customerCode fullName')
        .sort({ createdAt: -1 })
        .limit(5)
        .exec(),
      this.orderModel
        .find({ shopId, createdAt: { $gte: trendStart } })
        .select('amount createdAt')
        .exec(),
    ]);

    const revenueTotal = revenueAgg[0]?.total ?? 0;
    const changePercent =
      ordersYesterday === 0
        ? ordersToday > 0
          ? 100
          : 0
        : Math.round(
            ((ordersToday - ordersYesterday) / ordersYesterday) * 100,
          );

    const revenueByDay = new Map<string, number>();
    for (let i = 0; i < 7; i += 1) {
      const day = new Date(trendStart);
      day.setDate(trendStart.getDate() + i);
      revenueByDay.set(this.toDateKey(day), 0);
    }
    for (const order of trendOrders) {
      if (!order.createdAt) continue;
      const key = this.toDateKey(new Date(order.createdAt));
      revenueByDay.set(key, (revenueByDay.get(key) ?? 0) + order.amount);
    }

    return {
      kpis: [
        {
          label: 'Transactions',
          value: ordersTotal,
          change: changePercent,
        },
        {
          label: 'Orders',
          value: ordersTotal,
          change: changePercent,
        },
        {
          label: 'Customers',
          value: customersTotal,
          change: changePercent,
        },
        {
          label: 'Revenue',
          value: revenueTotal,
          change: changePercent,
          isCurrency: true,
        },
      ],
      statusSummary: [
        {
          label: 'Pending Shipments',
          value: pendingShipments,
          tone: 'warning',
        },
        {
          label: 'Delivered',
          value: deliveredShipments,
          tone: 'success',
        },
        {
          label: 'Return / Cancelled',
          value: cancelledOrders,
          tone: 'muted',
        },
      ],
      revenueTrend: Array.from(revenueByDay.entries()).map(
        ([date, amount]) => ({ date, amount }),
      ),
      recentOrders: recentOrders.map((order) => {
        const customer = order.customerId as unknown as {
          fullName?: string;
          customerCode?: string;
        };
        const rawName = customer?.fullName?.trim() || '';
        const displayName =
          !rawName ||
          /^chưa cập nhật$/i.test(rawName) ||
          /^customer\s+/i.test(rawName)
            ? 'Chưa cập nhật người đặt'
            : rawName;
        return {
          id: order._id.toString(),
          orderCode: order.orderCode,
          customer: displayName,
          amount: order.amount,
          status: order.status,
        };
      }),
    };
  }

  async getShopOwnerCustomers(user: UserDocument, query: PaginationQueryDto) {
    const shopId = await this.shopsService.resolveShopIdForUser(user);
    const { page, limit, skip } = parsePagination(query.page, query.limit);
    const filter = { shopId };

    const [items, total] = await Promise.all([
      this.customerModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.customerModel.countDocuments(filter).exec(),
    ]);

    return {
      items: items.map((item) => this.toCustomerItem(item)),
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async getShopOwnerCustomerById(user: UserDocument, customerId: string) {
    if (!Types.ObjectId.isValid(customerId)) {
      throw new BadRequestException('Invalid customer ID');
    }

    const shopId = await this.shopsService.resolveShopIdForUser(user);
    const customer = await this.customerModel
      .findOne({ _id: customerId, shopId })
      .exec();

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const orders = await this.orderModel
      .find({ shopId, customerId: customer._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .exec();

    return {
      ...this.toCustomerItem(customer),
      orders: orders.map((order) => ({
        id: order._id.toString(),
        orderCode: order.orderCode,
        transactionCode: order.transactionCode,
        amount: order.amount,
        status: order.status,
        createdAt: order.createdAt,
      })),
    };
  }

  async getShopOwnerPayments(user: UserDocument, query: PaginationQueryDto) {
    const shopId = await this.shopsService.resolveShopIdForUser(user);
    const { page, limit, skip } = parsePagination(query.page, query.limit);

    const orderIds = await this.orderModel
      .find({ shopId })
      .select('_id orderCode transactionCode')
      .exec();
    const orderMap = new Map(
      orderIds.map((order) => [order._id.toString(), order]),
    );
    const ids = orderIds.map((order) => order._id);
    const filter = { orderId: { $in: ids } };

    const [items, total] = await Promise.all([
      this.paymentModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.paymentModel.countDocuments(filter).exec(),
    ]);

    return {
      items: items.map((item) => {
        const order = orderMap.get(item.orderId.toString());
        return {
          id: item._id.toString(),
          paymentCode: item.paymentCode,
          orderId: item.orderId.toString(),
          orderCode: order?.orderCode,
          transactionCode: order?.transactionCode,
          amount: item.amount,
          status: item.status,
          method: item.method,
          createdAt: item.createdAt,
        };
      }),
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async getShopOwnerPaymentById(user: UserDocument, paymentId: string) {
    if (!Types.ObjectId.isValid(paymentId)) {
      throw new BadRequestException('Invalid payment ID');
    }

    const shopId = await this.shopsService.resolveShopIdForUser(user);
    const payment = await this.paymentModel.findById(paymentId).exec();

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const order = await this.orderModel
      .findOne({ _id: payment.orderId, shopId })
      .exec();

    if (!order) {
      throw new NotFoundException('Payment not found');
    }

    return {
      id: payment._id.toString(),
      paymentCode: payment.paymentCode,
      orderId: order._id.toString(),
      orderCode: order.orderCode,
      transactionCode: order.transactionCode,
      amount: payment.amount,
      status: payment.status,
      method: payment.method,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
  }

  async getShopOwnerShipments(user: UserDocument, query: PaginationQueryDto) {
    const shopId = await this.shopsService.resolveShopIdForUser(user);
    const { page, limit, skip } = parsePagination(query.page, query.limit);

    const orderIds = await this.orderModel
      .find({ shopId })
      .select('_id')
      .exec();
    const ids = orderIds.map((order) => order._id);

    const filter = { orderId: { $in: ids } };
    const [items, total] = await Promise.all([
      this.shipmentModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.shipmentModel.countDocuments(filter).exec(),
    ]);

    const orders = await this.orderModel
      .find({ _id: { $in: items.map((item) => item.orderId) } })
      .select('orderCode transactionCode')
      .exec();
    const orderMap = new Map(
      orders.map((order) => [order._id.toString(), order]),
    );

    return {
      items: items.map((item) => {
        const order = orderMap.get(item.orderId.toString());
        return {
          id: item._id.toString(),
          shipmentCode: item.shipmentCode,
          orderId: item.orderId.toString(),
          orderCode: order?.orderCode,
          transactionCode: order?.transactionCode,
          carrier: item.carrier,
          status: item.status,
          currentLocation: item.currentLocation,
          eta: item.eta,
          createdAt: item.createdAt,
        };
      }),
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async getShopOwnerShipmentById(user: UserDocument, shipmentId: string) {
    if (!Types.ObjectId.isValid(shipmentId)) {
      throw new BadRequestException('Invalid shipment ID');
    }

    const shopId = await this.shopsService.resolveShopIdForUser(user);
    const shipment = await this.shipmentModel.findById(shipmentId).exec();

    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    const order = await this.orderModel
      .findOne({ _id: shipment.orderId, shopId })
      .exec();

    if (!order) {
      throw new NotFoundException('Shipment not found');
    }

    await this.ensureShipmentMapCoords(shipment);
    await this.ensureShipmentEvents(shipment);
    const tracking = await this.getShipmentTracking(shipment);

    return {
      id: shipment._id.toString(),
      shipmentCode: shipment.shipmentCode,
      orderId: order._id.toString(),
      orderCode: order.orderCode,
      transactionCode: order.transactionCode,
      carrier: shipment.carrier,
      status: shipment.status,
      currentLocation: shipment.currentLocation,
      deliveryAddress: shipment.deliveryAddress,
      eta: shipment.eta,
      map: this.toShipmentMap(shipment),
      ...tracking,
      createdAt: shipment.createdAt,
      updatedAt: shipment.updatedAt,
    };
  }

  async getShopOwnerShipmentTimeline(
    user: UserDocument,
    shipmentId: string,
  ) {
    const detail = await this.getShopOwnerShipmentById(user, shipmentId);
    return {
      shipmentId: detail.id,
      shipmentCode: detail.shipmentCode,
      status: detail.status,
      currentLocation: detail.currentLocation,
      events: detail.events,
      timeline: detail.timeline,
    };
  }

  async recordShipmentEvent(params: {
    shipmentId: Types.ObjectId;
    status: ShipmentStatus;
    location?: string;
    note?: string;
  }) {
    return this.shipmentEventModel.create({
      shipmentId: params.shipmentId,
      status: params.status,
      location: params.location,
      note: params.note,
    });
  }

  async ensureShipmentEvents(shipment: ShipmentDocument) {
    const count = await this.shipmentEventModel
      .countDocuments({ shipmentId: shipment._id })
      .exec();
    if (count > 0) return;

    await this.recordShipmentEvent({
      shipmentId: shipment._id,
      status: ShipmentStatus.PENDING,
      location: shipment.currentLocation || 'Warehouse',
      note: 'Vận đơn được tạo',
    });

    if (
      shipment.status === ShipmentStatus.IN_TRANSIT ||
      shipment.status === ShipmentStatus.DELIVERED
    ) {
      await this.recordShipmentEvent({
        shipmentId: shipment._id,
        status: ShipmentStatus.IN_TRANSIT,
        location: shipment.currentLocation,
        note: this.defaultNoteForStatus(ShipmentStatus.IN_TRANSIT),
      });
    }

    if (shipment.status === ShipmentStatus.DELIVERED) {
      await this.recordShipmentEvent({
        shipmentId: shipment._id,
        status: ShipmentStatus.DELIVERED,
        location: shipment.currentLocation || shipment.deliveryAddress,
        note: this.defaultNoteForStatus(ShipmentStatus.DELIVERED),
      });
    }
  }

  async ensureShipmentMapCoords(shipment: ShipmentDocument) {
    const order = await this.orderModel.findById(shipment.orderId).exec();
    const seed = order?.transactionCode || shipment.shipmentCode;
    const map = buildMapFromCityIds({
      seed,
      status: shipment.status,
      currentCityId: shipment.currentCityId,
      destCityId: shipment.destCityId,
    });

    let dirty = false;
    if (shipment.mapIsMock !== false) {
      shipment.currentCityId = map.currentCityId;
      shipment.destCityId = map.destCityId;
      shipment.currentLat = map.currentLat;
      shipment.currentLng = map.currentLng;
      shipment.destLat = map.destLat;
      shipment.destLng = map.destLng;
      shipment.currentLocation = map.currentLocationText;
      if (
        !shipment.deliveryAddress ||
        shipment.deliveryAddress.includes('(mock)') ||
        shipment.deliveryAddress.includes('TP.HCM')
      ) {
        shipment.deliveryAddress = map.deliveryAddressText;
      }
      shipment.mapIsMock = true;
      dirty = true;
    } else if (shipment.currentLat == null || shipment.destLat == null) {
      shipment.currentCityId = map.currentCityId;
      shipment.destCityId = map.destCityId;
      shipment.currentLat = map.currentLat;
      shipment.currentLng = map.currentLng;
      shipment.destLat = map.destLat;
      shipment.destLng = map.destLng;
      shipment.mapIsMock = true;
      dirty = true;
    }

    if (dirty) {
      await shipment.save();
    }

    return map;
  }

  private async getShipmentTracking(shipment: ShipmentDocument) {
    const events = await this.shipmentEventModel
      .find({ shipmentId: shipment._id })
      .sort({ createdAt: 1 })
      .exec();

    return {
      events: events.map((event) => ({
        id: event._id.toString(),
        status: event.status,
        location: event.location,
        note: event.note,
        createdAt: event.createdAt,
      })),
      timeline: this.buildShipmentTimeline(shipment.status),
    };
  }

  private looksLikeStreetAddress(text: string) {
    const value = text.trim();
    if (value.length < 8) return false;
    // House number, postal, Japanese chome, or comma-separated street parts
    return (
      /\d/.test(value) ||
      value.includes(',') ||
      value.includes('丁目') ||
      value.includes('番') ||
      /street|avenue|road|ward|city/i.test(value)
    );
  }

  private toShipmentMap(shipment: ShipmentDocument) {
    return {
      current: {
        lat: shipment.currentLat,
        lng: shipment.currentLng,
        label: shipment.currentLocation || 'Vị trí hiện tại (mock)',
        cityId: shipment.currentCityId,
      },
      destination: {
        lat: shipment.destLat,
        lng: shipment.destLng,
        label: shipment.deliveryAddress || 'Điểm giao hàng (mock)',
        cityId: shipment.destCityId,
      },
      currentCityId: shipment.currentCityId,
      destCityId: shipment.destCityId,
      isMock: shipment.mapIsMock !== false,
    };
  }

  private defaultNoteForStatus(status: ShipmentStatus) {
    switch (status) {
      case ShipmentStatus.PENDING:
        return 'Đơn đang chờ lấy hàng';
      case ShipmentStatus.IN_TRANSIT:
        return 'Đơn đang trên đường vận chuyển';
      case ShipmentStatus.DELIVERED:
        return 'Giao hàng thành công';
      default:
        return 'Cập nhật trạng thái vận chuyển';
    }
  }

  private buildShipmentTimeline(status: string) {
    const steps = [
      { key: 'pending', label: 'Chờ lấy hàng / tạo vận đơn' },
      { key: 'in_transit', label: 'Đang vận chuyển' },
      { key: 'delivered', label: 'Giao hàng thành công' },
    ];

    const index = steps.findIndex((step) => step.key === status);

    return steps.map((step, stepIndex) => ({
      key: step.key,
      label: step.label,
      done:
        index > stepIndex ||
        (status === 'delivered' && step.key === 'delivered'),
      current: step.key === status,
    }));
  }

  private toDateKey(date: Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private toCustomerItem(customer: CustomerDocument) {
    return {
      id: customer._id.toString(),
      shopId: customer.shopId.toString(),
      customerCode: customer.customerCode,
      fullName: customer.fullName,
      phone: customer.phone,
      email: customer.email,
      totalSpent: customer.totalSpent,
      createdAt: customer.createdAt,
    };
  }

  private async getOrderDetail(orderId: string) {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('Invalid order ID');
    }

    const order = await this.orderModel
      .findById(orderId)
      .populate('customerId', 'customerCode fullName phone email totalSpent')
      .populate('shopId', 'shopCode shopName')
      .exec();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.toDetail(order);
  }

  private toAdminListItem(order: OrderDocument) {
    const base = this.toListItem(order);
    const shop = order.shopId as unknown as {
      _id?: Types.ObjectId;
      shopCode?: string;
      shopName?: string;
    };

    return {
      ...base,
      shop: shop?.shopCode
        ? {
            id: shop._id?.toString() ?? order.shopId.toString(),
            shopCode: shop.shopCode,
            shopName: shop.shopName,
          }
        : { id: order.shopId.toString() },
    };
  }

  private toListItem(order: OrderDocument) {
    const customer = order.customerId as unknown as {
      _id: Types.ObjectId;
      customerCode?: string;
      fullName?: string;
    };

    const shopIdValue = order.shopId as unknown as
      | Types.ObjectId
      | { _id: Types.ObjectId };

    return {
      id: order._id.toString(),
      shopId:
        typeof shopIdValue === 'object' &&
        shopIdValue !== null &&
        '_id' in shopIdValue
          ? shopIdValue._id.toString()
          : String(shopIdValue),
      orderCode: order.orderCode,
      transactionCode: order.transactionCode,
      amount: order.amount,
      status: order.status,
      customer: customer?.customerCode
        ? {
            id: customer._id.toString(),
            customerCode: customer.customerCode,
            fullName: customer.fullName,
          }
        : { id: order.customerId.toString() },
      createdAt: order.createdAt,
    };
  }

  private async toDetail(order: OrderDocument) {
    const [payment, shipment, items] = await Promise.all([
      this.paymentModel.findOne({ orderId: order._id }).exec(),
      this.shipmentModel.findOne({ orderId: order._id }).exec(),
      this.orderItemModel.find({ orderId: order._id }).sort({ createdAt: 1 }).exec(),
    ]);

    if (items.length === 0) {
      await this.ensureDefaultOrderItem(order);
      const backfilled = await this.orderItemModel
        .find({ orderId: order._id })
        .sort({ createdAt: 1 })
        .exec();
      items.push(...backfilled);
    }

    const customer = order.customerId as unknown as {
      _id: Types.ObjectId;
      customerCode?: string;
      fullName?: string;
      phone?: string;
      email?: string;
      totalSpent?: number;
    };

    const shop = order.shopId as unknown as {
      _id?: Types.ObjectId;
      shopCode?: string;
      shopName?: string;
    };

    const shopIdValue = order.shopId as unknown as
      | Types.ObjectId
      | { _id: Types.ObjectId };

    return {
      id: order._id.toString(),
      shopId:
        shop?._id?.toString() ??
        (typeof shopIdValue === 'object' &&
        shopIdValue !== null &&
        '_id' in shopIdValue
          ? shopIdValue._id.toString()
          : String(shopIdValue)),
      shop: shop?.shopCode
        ? {
            id: shop._id?.toString(),
            shopCode: shop.shopCode,
            shopName: shop.shopName,
          }
        : undefined,
      orderCode: order.orderCode,
      transactionCode: order.transactionCode,
      amount: order.amount,
      status: order.status,
      batchId: order.batchId?.toString(),
      submissionId: order.submissionId?.toString(),
      customer: customer?.customerCode
        ? {
            id: customer._id.toString(),
            customerCode: customer.customerCode,
            fullName: customer.fullName,
            phone: customer.phone,
            email: customer.email,
            totalSpent: customer.totalSpent,
          }
        : { id: order.customerId.toString() },
      items: items.map((item) => ({
        id: item._id.toString(),
        productId: item.productId.toString(),
        productCode: item.productCode,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
      })),
      payment: payment
        ? {
            id: payment._id.toString(),
            paymentCode: payment.paymentCode,
            amount: payment.amount,
            status: payment.status,
            method: payment.method,
          }
        : null,
      shipment: shipment
        ? {
            id: shipment._id.toString(),
            shipmentCode: shipment.shipmentCode,
            carrier: shipment.carrier,
            status: shipment.status,
            currentLocation: shipment.currentLocation,
            deliveryAddress: shipment.deliveryAddress,
            eta: shipment.eta,
            ...(await this.getShipmentTrackingAfterEnsure(shipment)),
          }
        : null,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  private async getShipmentTrackingAfterEnsure(shipment: ShipmentDocument) {
    await this.ensureShipmentMapCoords(shipment);
    await this.ensureShipmentEvents(shipment);
    return {
      ...this.toShipmentMapPayload(shipment),
      ...(await this.getShipmentTracking(shipment)),
    };
  }

  private toShipmentMapPayload(shipment: ShipmentDocument) {
    return {
      map: this.toShipmentMap(shipment),
    };
  }
}
