import { Module } from '@nestjs/common';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';
import { DatabaseModule } from '../database/database.module';
import { ShopsModule } from '../shops/shops.module';
import { AdminOrdersController } from './admin-orders.controller';
import { AdminProductsController } from './admin-products.controller';
import { CustomersController } from './customers.controller';
import { DashboardController } from './dashboard.controller';
import { GeocodeService } from './geocode.service';
import { MapController } from './map.controller';
import { OrderFillCronService } from './order-fill-cron.service';
import { OrderFillService } from './order-fill.service';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PaymentsController } from './payments.controller';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ShipmentsController } from './shipments.controller';

@Module({
  imports: [DatabaseModule, ShopsModule, ActivityLogsModule],
  controllers: [
    AdminOrdersController,
    AdminProductsController,
    OrdersController,
    ShipmentsController,
    CustomersController,
    PaymentsController,
    ProductsController,
    DashboardController,
    MapController,
  ],
  providers: [
    OrdersService,
    ProductsService,
    GeocodeService,
    OrderFillService,
    OrderFillCronService,
  ],
  exports: [OrdersService, ProductsService, GeocodeService],
})
export class OrdersModule {}
