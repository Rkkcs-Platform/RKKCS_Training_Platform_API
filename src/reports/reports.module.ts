import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ShopsModule } from '../shops/shops.module';
import {
  AdminDashboardController,
  AdminReportsController,
  AdminTransactionCodesController,
} from './admin-reports.controller';
import { ReportsService } from './reports.service';
import { StatisticsController } from './statistics.controller';

@Module({
  imports: [DatabaseModule, ShopsModule],
  controllers: [
    AdminDashboardController,
    AdminReportsController,
    AdminTransactionCodesController,
    StatisticsController,
  ],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
