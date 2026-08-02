import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { UserRole } from '../common/enums';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrdersService } from './orders.service';

@ApiTags('Admin - Orders')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin/orders')
export class AdminOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'List all orders' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.ordersService.getAdminOrders(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order detail' })
  findOne(@Param('id') id: string) {
    return this.ordersService.getAdminOrderById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update order (admin)' })
  update(@Param('id') id: string, @Body() dto: UpdateOrderDto) {
    return this.ordersService.updateAdminOrder(id, dto);
  }
}
