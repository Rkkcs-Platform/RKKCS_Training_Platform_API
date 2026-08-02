import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import {
  ActivityLog,
  ActivityLogSchema,
  Challenge,
  ChallengeSchema,
  ChallengeSetting,
  ChallengeSettingSchema,
  Customer,
  CustomerSchema,
  Category,
  CategorySchema,
  News,
  NewsSchema,
  Order,
  OrderSchema,
  OrderItem,
  OrderItemSchema,
  Payment,
  PaymentSchema,
  ProcessingJob,
  ProcessingJobSchema,
  Product,
  ProductSchema,
  Shipment,
  ShipmentSchema,
  ShipmentEvent,
  ShipmentEventSchema,
  Shop,
  ShopSchema,
  User,
  UserSchema,
  UserSubmission,
  UserSubmissionSchema,
} from '../schemas';
import { DatabaseLoggerService } from './database-logger.service';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('Database');

        return {
          uri: configService.getOrThrow<string>('MONGODB_URI'),
          connectionFactory: (connection: Connection) => {
            connection.on('error', (error: Error) => {
              logger.error(`MongoDB connection failed: ${error.message}`);
            });
            return connection;
          },
        };
      },
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Shop.name, schema: ShopSchema },
      { name: ChallengeSetting.name, schema: ChallengeSettingSchema },
      { name: Challenge.name, schema: ChallengeSchema },
      { name: UserSubmission.name, schema: UserSubmissionSchema },
      { name: ActivityLog.name, schema: ActivityLogSchema },
      { name: Customer.name, schema: CustomerSchema },
      { name: Order.name, schema: OrderSchema },
      { name: OrderItem.name, schema: OrderItemSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Category.name, schema: CategorySchema },
      { name: News.name, schema: NewsSchema },
      { name: Payment.name, schema: PaymentSchema },

      { name: Shipment.name, schema: ShipmentSchema },
      { name: ShipmentEvent.name, schema: ShipmentEventSchema },
      { name: ProcessingJob.name, schema: ProcessingJobSchema },
    ]),
  ],
  providers: [DatabaseLoggerService],
  exports: [MongooseModule],
})
export class DatabaseModule {}
