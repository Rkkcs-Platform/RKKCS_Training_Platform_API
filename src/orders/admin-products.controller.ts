import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsMongoId, IsOptional } from 'class-validator';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { ACTIVITY_ACTION } from '../common/constants/activity-action.constant';
import { ACTIVITY_TARGET } from '../common/constants/activity-target.constant';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { UserRole } from '../common/enums';
import type { UserDocument } from '../schemas/user.schema';
import {
  CreateAdminProductDto,
  UpdateProductDto,
} from './dto/create-product.dto';
import { FillShopOrderDataDto } from './dto/fill-shop-order-data.dto';
import { OrderFillService } from './order-fill.service';
import { ProductsService } from './products.service';

class AdminProductListQuery extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  shopId?: string;
}

@ApiTags('Admin - Products')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin/products')
export class AdminProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly orderFillService: OrderFillService,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List products' })
  findAll(@Query() query: AdminProductListQuery) {
    return this.productsService.getAdminProducts(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create product for a shop' })
  create(@Body() dto: CreateAdminProductDto) {
    const { shopId, ...productDto } = dto;
    return this.productsService.createAdminProduct(shopId, productDto);
  }

  @Post('fill-all')
  @ApiOperation({
    summary:
      'Fill placeholder customer + replace DEFAULT products. Pass shopId for one shop, or omit to fill every active shop.',
  })
  async fillAll(
    @CurrentUser() admin: UserDocument,
    @Body() dto: FillShopOrderDataDto = {},
  ) {
    const result = dto.shopId
      ? await this.orderFillService.fillShop(dto.shopId)
      : await this.summarizeAllShops();

    this.activityLogsService.recordFromUser(admin, {
      action: ACTIVITY_ACTION.ORDER_FILL_ALL,
      targetType: ACTIVITY_TARGET.SHOP,
      targetId: dto.shopId,
      metadata: { ...result },
    });

    return result;
  }

  private async summarizeAllShops() {
    const all = await this.orderFillService.fillAllActiveShops();
    return {
      shopsProcessed: all.shopsProcessed,
      shopId: '',
      shopCode: '*',
      productsCreated: all.results.reduce((sum, row) => sum + row.productsCreated, 0),
      productsExisting: all.results.reduce(
        (sum, row) => sum + row.productsExisting,
        0,
      ),
      customersUpdated: all.results.reduce(
        (sum, row) => sum + row.customersUpdated,
        0,
      ),
      ordersProductUpdated: all.results.reduce(
        (sum, row) => sum + row.ordersProductUpdated,
        0,
      ),
      ordersScanned: all.results.reduce((sum, row) => sum + row.ordersScanned, 0),
      ordersFailed: all.results.reduce((sum, row) => sum + row.ordersFailed, 0),
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update product' })
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.updateAdminProduct(id, dto);
  }
}
