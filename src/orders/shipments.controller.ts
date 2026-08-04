import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import type { UserDocument } from '../schemas/user.schema';
import { OrdersService } from './orders.service';

@ApiTags('Shipments')
@ApiBearerAuth()
@Controller('shipments')
export class ShipmentsController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'List shipments for current shop' })
  findAll(
    @CurrentUser() user: UserDocument,
    @Query() query: PaginationQueryDto,
  ) {
    return this.ordersService.getShopOwnerShipments(user, query);
  }

  @Get(':id/timeline')
  @ApiOperation({ summary: 'Get shipment tracking timeline' })
  timeline(@CurrentUser() user: UserDocument, @Param('id') id: string) {
    return this.ordersService.getShopOwnerShipmentTimeline(user, id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get shipment detail for current shop' })
  findOne(@CurrentUser() user: UserDocument, @Param('id') id: string) {
    return this.ordersService.getShopOwnerShipmentById(user, id);
  }
}
