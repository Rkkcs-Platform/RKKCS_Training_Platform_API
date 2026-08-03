import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import type { UserDocument } from '../schemas/user.schema';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrdersService } from './orders.service';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'List orders for current shop' })
  findAll(
    @CurrentUser() user: UserDocument,
    @Query() query: PaginationQueryDto,
  ) {
    return this.ordersService.getShopOwnerOrders(user, query);
  }

  @Get('by-code/:code')
  @ApiOperation({ summary: 'Get order by transaction code' })
  findByCode(
    @CurrentUser() user: UserDocument,
    @Param('code') code: string,
  ) {
    return this.ordersService.getShopOwnerOrderByTransactionCode(user, code);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order detail for current shop' })
  findOne(@CurrentUser() user: UserDocument, @Param('id') id: string) {
    return this.ordersService.getShopOwnerOrderById(user, id);
  }

  @Patch(':id')
  @ApiOperation({
    summary:
      'Update order status, customer info, shipment tracking, and products',
  })
  update(
    @CurrentUser() user: UserDocument,
    @Param('id') id: string,
    @Body() dto: UpdateOrderDto,
  ) {
    return this.ordersService.updateShopOwnerOrder(user, id, dto);
  }
}
