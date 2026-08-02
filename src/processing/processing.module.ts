import { Module } from '@nestjs/common';
import { ChallengesModule } from '../challenges/challenges.module';
import { DatabaseModule } from '../database/database.module';
import { OrdersModule } from '../orders/orders.module';
import { AdminBatchesController } from './admin-batches.controller';
import { ProcessingService } from './processing.service';

@Module({
  imports: [DatabaseModule, ChallengesModule, OrdersModule],
  controllers: [AdminBatchesController],
  providers: [ProcessingService],
  exports: [ProcessingService],
})
export class ProcessingJobsModule {}
