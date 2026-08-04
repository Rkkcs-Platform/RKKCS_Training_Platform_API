import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AdminShopsController } from './admin-shops.controller';
import { ShopOwnerController } from './shop-owner.controller';
import { ShopsService } from './shops.service';

@Module({
  imports: [DatabaseModule],
  controllers: [AdminShopsController, ShopOwnerController],
  providers: [ShopsService],
  exports: [ShopsService],
})
export class ShopsModule {}
