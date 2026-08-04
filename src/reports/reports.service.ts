import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  OrderStatus,
  PaymentStatus,
  ProcessingJobStatus,
  ShipmentStatus,
  SubmissionStatus,
} from '../common/enums';
import { Challenge, ChallengeDocument } from '../schemas/challenge.schema';
import { Customer, CustomerDocument } from '../schemas/customer.schema';
import { Order, OrderDocument } from '../schemas/order.schema';
import { Payment, PaymentDocument } from '../schemas/payment.schema';
import {
  ProcessingJob,
  ProcessingJobDocument,
} from '../schemas/processing-job.schema';
import { Shipment, ShipmentDocument } from '../schemas/shipment.schema';
import { Shop, ShopDocument } from '../schemas/shop.schema';
import { User, UserDocument } from '../schemas/user.schema';
import {
  UserSubmission,
  UserSubmissionDocument,
} from '../schemas/user-submission.schema';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<PaymentDocument>,
    @InjectModel(Shipment.name)
    private readonly shipmentModel: Model<ShipmentDocument>,
    @InjectModel(Customer.name)
    private readonly customerModel: Model<CustomerDocument>,
    @InjectModel(Shop.name)
    private readonly shopModel: Model<ShopDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Challenge.name)
    private readonly challengeModel: Model<ChallengeDocument>,
    @InjectModel(UserSubmission.name)
    private readonly submissionModel: Model<UserSubmissionDocument>,
    @InjectModel(ProcessingJob.name)
    private readonly processingJobModel: Model<ProcessingJobDocument>,
  ) {}

  async getAdminDashboard() {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const trendStart = new Date(startOfToday);
    trendStart.setDate(trendStart.getDate() - 6);
    const todayKey = this.toDateKey(startOfToday);

    const [
      shopsTotal,
      usersTotal,
      ordersTotal,
      customersTotal,
      revenueAgg,
      ordersToday,
      submissionsToday,
      batchesToday,
      pendingJobs,
      failedJobs,
      pendingShipments,
      paidPayments,
      revenueTrend,
      ordersByStatus,
      topShops,
    ] = await Promise.all([
      this.shopModel.countDocuments().exec(),
      this.userModel.countDocuments().exec(),
      this.orderModel.countDocuments().exec(),
      this.customerModel.countDocuments().exec(),
      this.orderModel
        .aggregate<{ total: number }>([
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ])
        .exec(),
      this.orderModel
        .countDocuments({ createdAt: { $gte: startOfToday } })
        .exec(),
      this.submissionModel.countDocuments({ date: todayKey }).exec(),
      this.challengeModel.countDocuments({ date: todayKey }).exec(),
      this.processingJobModel
        .countDocuments({
          status: {
            $in: [ProcessingJobStatus.PENDING, ProcessingJobStatus.RUNNING],
          },
        })
        .exec(),
      this.processingJobModel
        .countDocuments({ status: ProcessingJobStatus.FAILED })
        .exec(),
      this.shipmentModel
        .countDocuments({
          status: {
            $in: [ShipmentStatus.PENDING, ShipmentStatus.IN_TRANSIT],
          },
        })
        .exec(),
      this.paymentModel
        .countDocuments({ status: PaymentStatus.PAID })
        .exec(),
      this.orderModel
        .aggregate<{ _id: string; amount: number; count: number }>([
          { $match: { createdAt: { $gte: trendStart } } },
          {
            $group: {
              _id: {
                $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
              },
              amount: { $sum: '$amount' },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ])
        .exec(),
      this.orderModel
        .aggregate<{ _id: string; count: number }>([
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ])
        .exec(),
      this.orderModel
        .aggregate<{
          _id: Types.ObjectId;
          orders: number;
          revenue: number;
        }>([
          {
            $group: {
              _id: '$shopId',
              orders: { $sum: 1 },
              revenue: { $sum: '$amount' },
            },
          },
          { $sort: { revenue: -1 } },
          { $limit: 5 },
        ])
        .exec(),
    ]);

    const shopIds = topShops.map((row) => row._id);
    const shops = await this.shopModel
      .find({ _id: { $in: shopIds } })
      .select('shopCode shopName')
      .exec();
    const shopMap = new Map(
      shops.map((shop) => [shop._id.toString(), shop]),
    );

    const revenueByDay = new Map<string, { amount: number; count: number }>();
    for (let i = 0; i < 7; i += 1) {
      const day = new Date(trendStart);
      day.setDate(trendStart.getDate() + i);
      revenueByDay.set(this.toDateKey(day), { amount: 0, count: 0 });
    }
    for (const row of revenueTrend) {
      revenueByDay.set(row._id, { amount: row.amount, count: row.count });
    }

    return {
      kpis: [
        { label: 'Shops', value: shopsTotal },
        { label: 'Users', value: usersTotal },
        { label: 'Orders', value: ordersTotal },
        {
          label: 'Revenue',
          value: revenueAgg[0]?.total ?? 0,
          isCurrency: true,
        },
        { label: 'Customers', value: customersTotal },
        { label: 'Orders today', value: ordersToday },
      ],
      today: {
        batches: batchesToday,
        submissions: submissionsToday,
        orders: ordersToday,
      },
      ops: {
        pendingShipments,
        paidPayments,
        pendingJobs,
        failedJobs,
      },
      revenueTrend: Array.from(revenueByDay.entries()).map(
        ([date, data]) => ({
          date,
          amount: data.amount,
          orders: data.count,
        }),
      ),
      ordersByStatus: ordersByStatus.map((row) => ({
        status: row._id,
        count: row.count,
      })),
      topShops: topShops.map((row) => {
        const shop = shopMap.get(row._id.toString());
        return {
          shopId: row._id.toString(),
          shopCode: shop?.shopCode ?? '—',
          shopName: shop?.shopName ?? '—',
          orders: row.orders,
          revenue: row.revenue,
        };
      }),
    };
  }

  async getAdminRevenueReport(days = 30) {
    const safeDays = Math.min(Math.max(days, 1), 90);
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (safeDays - 1));

    const [byDay, byShop] = await Promise.all([
      this.orderModel
        .aggregate<{ _id: string; amount: number; count: number }>([
          { $match: { createdAt: { $gte: start } } },
          {
            $group: {
              _id: {
                $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
              },
              amount: { $sum: '$amount' },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ])
        .exec(),
      this.orderModel
        .aggregate<{
          _id: Types.ObjectId;
          amount: number;
          count: number;
        }>([
          { $match: { createdAt: { $gte: start } } },
          {
            $group: {
              _id: '$shopId',
              amount: { $sum: '$amount' },
              count: { $sum: 1 },
            },
          },
          { $sort: { amount: -1 } },
        ])
        .exec(),
    ]);

    const shops = await this.shopModel
      .find({ _id: { $in: byShop.map((row) => row._id) } })
      .select('shopCode shopName')
      .exec();
    const shopMap = new Map(
      shops.map((shop) => [shop._id.toString(), shop]),
    );

    return {
      days: safeDays,
      totalRevenue: byDay.reduce((sum, row) => sum + row.amount, 0),
      totalOrders: byDay.reduce((sum, row) => sum + row.count, 0),
      byDay: byDay.map((row) => ({
        date: row._id,
        amount: row.amount,
        orders: row.count,
      })),
      byShop: byShop.map((row) => {
        const shop = shopMap.get(row._id.toString());
        return {
          shopId: row._id.toString(),
          shopCode: shop?.shopCode ?? '—',
          shopName: shop?.shopName ?? '—',
          amount: row.amount,
          orders: row.count,
        };
      }),
    };
  }

  async getAdminOrdersReport() {
    const [byStatus, byDay] = await Promise.all([
      this.orderModel
        .aggregate<{ _id: string; count: number; amount: number }>([
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
              amount: { $sum: '$amount' },
            },
          },
        ])
        .exec(),
      this.orderModel
        .aggregate<{ _id: string; count: number }>([
          {
            $group: {
              _id: {
                $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: -1 } },
          { $limit: 14 },
        ])
        .exec(),
    ]);

    return {
      byStatus: byStatus.map((row) => ({
        status: row._id as OrderStatus,
        count: row.count,
        amount: row.amount,
      })),
      recentDays: byDay
        .map((row) => ({ date: row._id, count: row.count }))
        .reverse(),
    };
  }

  async getShopRevenueStats(shopId: Types.ObjectId, days = 30) {
    const safeDays = Math.min(Math.max(days, 1), 90);
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (safeDays - 1));

    const byDay = await this.orderModel
      .aggregate<{ _id: string; amount: number; count: number }>([
        { $match: { shopId, createdAt: { $gte: start } } },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            amount: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .exec();

    return {
      days: safeDays,
      totalRevenue: byDay.reduce((sum, row) => sum + row.amount, 0),
      totalOrders: byDay.reduce((sum, row) => sum + row.count, 0),
      byDay: byDay.map((row) => ({
        date: row._id,
        amount: row.amount,
        orders: row.count,
      })),
    };
  }

  async getShopOrdersStats(shopId: Types.ObjectId) {
    const byStatus = await this.orderModel
      .aggregate<{ _id: string; count: number; amount: number }>([
        { $match: { shopId } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            amount: { $sum: '$amount' },
          },
        },
      ])
      .exec();

    return {
      byStatus: byStatus.map((row) => ({
        status: row._id,
        count: row.count,
        amount: row.amount,
      })),
    };
  }

  async getAdminTransactionCodes(query: {
    page?: number;
    limit?: number;
    date?: string;
    shopId?: string;
    q?: string;
  }) {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(query.limit) || 50, 1), 200);
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (query.date) filter.date = query.date;
    if (query.shopId && Types.ObjectId.isValid(query.shopId)) {
      filter.shopId = new Types.ObjectId(query.shopId);
    }

    const challenges = await this.challengeModel
      .find(filter)
      .populate('shopId', 'shopCode shopName')
      .sort({ date: -1, createdAt: -1 })
      .exec();

    const challengeIds = challenges.map((c) => c._id);
    const submissions = await this.submissionModel
      .find({ challengeId: { $in: challengeIds } })
      .select('challengeId answers status totalCorrect totalWrong')
      .exec();

    const submissionByChallenge = new Map<
      string,
      UserSubmissionDocument[]
    >();
    for (const submission of submissions) {
      const key = submission.challengeId.toString();
      const list = submissionByChallenge.get(key) ?? [];
      list.push(submission);
      submissionByChallenge.set(key, list);
    }

    const q = query.q?.trim().toUpperCase();
    const flat: Array<Record<string, unknown>> = [];

    for (const challenge of challenges) {
      const shop = challenge.shopId as unknown as {
        _id?: Types.ObjectId;
        shopCode?: string;
        shopName?: string;
      };
      const related = submissionByChallenge.get(challenge._id.toString()) ?? [];
      const correctSet = new Set<string>();
      const wrongSet = new Set<string>();
      for (const submission of related) {
        for (const answer of submission.answers ?? []) {
          if (answer.isCorrect && answer.matchedCode) {
            correctSet.add(answer.matchedCode);
          } else if (!answer.isCorrect) {
            wrongSet.add(answer.inputCode);
          }
        }
      }

      for (const code of challenge.codes ?? []) {
        if (q && !code.code.includes(q)) continue;
        const used = correctSet.has(code.code);
        flat.push({
          code: code.code,
          order: code.order,
          date: challenge.date,
          challengeId: challenge._id.toString(),
          batchStatus: challenge.status,
          shopId:
            shop?._id?.toString() ??
            (challenge.shopId as Types.ObjectId).toString(),
          shopCode: shop?.shopCode,
          shopName: shop?.shopName,
          used,
          wrongAttempts: wrongSet.has(code.code),
        });
      }
    }

    const total = flat.length;
    const items = flat.slice(skip, skip + limit);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(Math.ceil(total / limit), 1),
      },
      summary: {
        totalCodes: total,
        used: flat.filter((item) => item.used).length,
        unused: flat.filter((item) => !item.used).length,
        batches: challenges.length,
        completedSubmissions: submissions.filter(
          (s) => s.status === SubmissionStatus.COMPLETED,
        ).length,
      },
    };
  }

  private toDateKey(date: Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
