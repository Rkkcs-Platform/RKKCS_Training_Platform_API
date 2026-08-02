import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import type { UserDocument } from '../schemas/user.schema';
import { OrdersService } from './orders.service';

@ApiTags('Payments')
@ApiBearerAuth()
@Controller('payments')
export class PaymentsController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'List payments for current shop' })
  findAll(
    @CurrentUser() user: UserDocument,
    @Query() query: PaginationQueryDto,
  ) {
    return this.ordersService.getShopOwnerPayments(user, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment detail for current shop' })
  findOne(@CurrentUser() user: UserDocument, @Param('id') id: string) {
    return this.ordersService.getShopOwnerPaymentById(user, id);
  }
}
