import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import type { UserDocument } from '../schemas/user.schema';
import { ProductsService } from './products.service';

@ApiTags('Products')
@ApiBearerAuth()
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'List active products for current shop' })
  findAll(
    @CurrentUser() user: UserDocument,
    @Query() query: PaginationQueryDto,
  ) {
    return this.productsService.getShopOwnerProducts(user, query);
  }
}
