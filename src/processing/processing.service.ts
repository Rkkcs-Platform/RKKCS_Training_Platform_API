import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  OrderStatus,
  PaymentStatus,
  ProcessingJobStatus,
  ShipmentStatus,
} from '../common/enums';
import { buildMockShipmentMap } from '../common/utils';
import { ChallengesService } from '../challenges/challenges.service';
import { OrdersService } from '../orders/orders.service';
import { Customer, CustomerDocument } from '../schemas/customer.schema';
import { Order, OrderDocument } from '../schemas/order.schema';
import { Payment, PaymentDocument } from '../schemas/payment.schema';
import {
  ProcessingJob,
  ProcessingJobDocument,
} from '../schemas/processing-job.schema';
import { Shipment, ShipmentDocument } from '../schemas/shipment.schema';
import {
  UserSubmission,
  UserSubmissionDocument,
} from '../schemas/user-submission.schema';

export interface ProcessBatchOptions {
  force?: boolean;
}

@Injectable()
export class ProcessingService {
  private readonly logger = new Logger(ProcessingService.name);

  constructor(
    @InjectModel(ProcessingJob.name)
    private readonly processingJobModel: Model<ProcessingJobDocument>,
    @InjectModel(UserSubmission.name)
    private readonly submissionModel: Model<UserSubmissionDocument>,
    @InjectModel(Customer.name)
    private readonly customerModel: Model<CustomerDocument>,
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<PaymentDocument>,
    @InjectModel(Shipment.name)
    private readonly shipmentModel: Model<ShipmentDocument>,
    private readonly challengesService: ChallengesService,
    private readonly ordersService: OrdersService,
  ) {}

  /**
   * Create order/payment/shipment for every correct answer in a submission.
   * Spec: 1 correct code → 1 order. Idempotent by transactionCode.
   */
  async processSubmissionCorrectAnswers(submissionId: Types.ObjectId | string) {
    const submission = await this.submissionModel.findById(submissionId).exec();
    if (!submission) {
      return 0;
    }

    const challenge = await this.challengesService.findById(
      submission.challengeId.toString(),
    );
    const shopId = challenge.shopId;
    if (!shopId) {
      this.logger.warn(
        `Skip order processing: batch ${challenge._id.toString()} has no shopId`,
      );
      return 0;
    }

    let generatedOrders = 0;
    const correctAnswers = submission.answers.filter(
      (answer) => answer.isCorrect && (answer.matchedCode || answer.inputCode),
    );

    for (const answer of correctAnswers) {
      const transactionCode = (
        answer.matchedCode ?? answer.inputCode
      ).toUpperCase();

      try {
        const created = await this.ensureOrderTree({
          shopId,
          transactionCode,
          batchId: challenge._id,
          submissionId: submission._id,
        });
        if (created) {
          generatedOrders += 1;
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown processing error';
        this.logger.error(
          `Failed to create order for code ${transactionCode}: ${message}`,
        );
      }
    }

    if (generatedOrders > 0) {
      this.logger.log(
        `Created ${generatedOrders} order(s) from submission ${submission._id.toString()}`,
      );
    }

    return generatedOrders;
  }

  /**
   * Create order/payment/shipment immediately for one correct code.
   * Spec: 1 correct code → 1 order.
   */
  async processCorrectCode(params: {
    shopId: Types.ObjectId;
    transactionCode: string;
    batchId: Types.ObjectId;
    submissionId: Types.ObjectId;
  }) {
    try {
      const created = await this.ensureOrderTree({
        shopId: params.shopId,
        transactionCode: params.transactionCode.toUpperCase(),
        batchId: params.batchId,
        submissionId: params.submissionId,
      });

      if (created) {
        this.logger.log(
          `Created order for code ${params.transactionCode} (batch ${params.batchId.toString()})`,
        );
      }

      return created;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown processing error';
      this.logger.error(
        `Failed to create order for code ${params.transactionCode}: ${message}`,
      );
      throw error;
    }
  }

  async processBatch(
    challengeId: string,
    options: ProcessBatchOptions = {},
  ) {
    const challenge = await this.challengesService.findById(challengeId);
    const shopId = challenge.shopId;

    const job = await this.processingJobModel.create({
      batchId: challenge._id,
      shopId,
      status: ProcessingJobStatus.RUNNING,
      generatedOrders: 0,
    });

    try {
      const submissions = await this.submissionModel
        .find({
          challengeId: challenge._id,
        })
        .exec();

      let generatedOrders = 0;

      for (const submission of submissions) {
        const correctAnswers = submission.answers.filter(
          (answer) => answer.isCorrect && (answer.matchedCode || answer.inputCode),
        );

        for (const answer of correctAnswers) {
          const transactionCode = (
            answer.matchedCode ?? answer.inputCode
          ).toUpperCase();

          const created = await this.ensureOrderTree({
            shopId,
            transactionCode,
            batchId: challenge._id,
            submissionId: submission._id,
            force: options.force,
          });

          if (created) {
            generatedOrders += 1;
          }
        }
      }

      job.status = ProcessingJobStatus.COMPLETED;
      job.generatedOrders = generatedOrders;
      job.completedAt = new Date();
      await job.save();

      this.logger.log(
        `Processed batch ${challengeId}: ${generatedOrders} orders generated`,
      );

      return this.toJobResponse(job);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown processing error';

      job.status = ProcessingJobStatus.FAILED;
      job.error = message;
      job.completedAt = new Date();
      await job.save();

      this.logger.error(
        `Failed to process batch ${challengeId}: ${message}`,
      );

      throw error;
    }
  }

  private async ensureOrderTree(params: {
    shopId: Types.ObjectId;
    transactionCode: string;
    batchId: Types.ObjectId;
    submissionId: Types.ObjectId;
    force?: boolean;
  }): Promise<boolean> {
    const existingOrder = await this.orderModel
      .findOne({ transactionCode: params.transactionCode })
      .exec();

    if (existingOrder) {
      await this.ensurePaymentAndShipment(existingOrder);
      await this.ordersService.ensureDefaultOrderItem(existingOrder);
      return false;
    }

    const customer = await this.getOrCreateSyntheticCustomer(
      params.shopId,
      params.transactionCode,
    );

    const amount = this.deriveAmount(params.transactionCode);
    const orderCode = `ORD-${params.transactionCode}`;

    try {
      const order = await this.orderModel.create({
        shopId: params.shopId,
        customerId: customer._id,
        orderCode,
        amount,
        status: OrderStatus.CONFIRMED,
        transactionCode: params.transactionCode,
        batchId: params.batchId,
        submissionId: params.submissionId,
      });

      customer.totalSpent += amount;
      await customer.save();

      await this.ensurePaymentAndShipment(order);
      await this.ordersService.ensureDefaultOrderItem(order);
      return true;
    } catch (error) {
      const isDuplicate =
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: number }).code === 11000;

      if (isDuplicate) {
        const order = await this.orderModel
          .findOne({ transactionCode: params.transactionCode })
          .exec();
        if (order) {
          await this.ensurePaymentAndShipment(order);
          await this.ordersService.ensureDefaultOrderItem(order);
        }
        return false;
      }

      throw error;
    }
  }

  private async ensurePaymentAndShipment(order: OrderDocument) {
    const existingPayment = await this.paymentModel
      .findOne({ orderId: order._id })
      .exec();

    if (!existingPayment) {
      await this.paymentModel.create({
        orderId: order._id,
        paymentCode: `PAY-${order.transactionCode}`,
        amount: order.amount,
        status: PaymentStatus.PAID,
        method: 'system',
      });
    }

    const existingShipment = await this.shipmentModel
      .findOne({ orderId: order._id })
      .exec();

    if (!existingShipment) {
      const eta = new Date();
      eta.setDate(eta.getDate() + 3);
      const map = buildMockShipmentMap(
        order.transactionCode,
        ShipmentStatus.PENDING,
      );

      const shipment = await this.shipmentModel.create({
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
        eta,
      });

      await this.ordersService.ensureShipmentEvents(shipment);
    } else {
      await this.ordersService.ensureShipmentMapCoords(existingShipment);
      await this.ordersService.ensureShipmentEvents(existingShipment);
    }
  }

  private async getOrCreateSyntheticCustomer(
    shopId: Types.ObjectId,
    transactionCode: string,
  ): Promise<CustomerDocument> {
    // customerCode is an internal stub key (1 order → 1 customer record),
    // NOT the person's name and NOT the shipment/transaction code for display.
    const customerCode = `CUS-${transactionCode}`;
    const existing = await this.customerModel
      .findOne({ shopId, customerCode })
      .exec();

    if (existing) {
      // Migrate old placeholder names that wrongly looked like the transaction code
      if (
        !existing.fullName ||
        /^customer\s+/i.test(existing.fullName) ||
        existing.fullName === transactionCode
      ) {
        existing.fullName = 'Chưa cập nhật';
        await existing.save();
      }
      return existing;
    }

    return this.customerModel.create({
      shopId,
      customerCode,
      fullName: 'Chưa cập nhật',
      totalSpent: 0,
    });
  }

  private deriveAmount(transactionCode: string): number {
    let hash = 0;
    for (let i = 0; i < transactionCode.length; i += 1) {
      hash = (hash + transactionCode.charCodeAt(i) * (i + 1)) % 900_000;
    }
    return 100_000 + hash;
  }

  toJobResponse(job: ProcessingJobDocument) {
    return {
      id: job._id.toString(),
      batchId: job.batchId.toString(),
      shopId: job.shopId.toString(),
      status: job.status,
      generatedOrders: job.generatedOrders,
      error: job.error,
      completedAt: job.completedAt,
      createdAt: job.createdAt,
    };
  }

  async getJobById(jobId: string) {
    if (!Types.ObjectId.isValid(jobId)) {
      throw new NotFoundException('Processing job not found');
    }

    const job = await this.processingJobModel.findById(jobId).exec();

    if (!job) {
      throw new NotFoundException('Processing job not found');
    }

    return this.toJobResponse(job);
  }
}
