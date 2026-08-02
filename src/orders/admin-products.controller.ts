import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsMongoId, IsOptional } from 'class-validator';
import { Roles } from '../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { UserRole } from '../common/enums';
import {
  CreateAdminProductDto,
  UpdateProductDto,
} from './dto/create-product.dto';
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
  constructor(private readonly productsService: ProductsService) {}

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

  @Patch(':id')
  @ApiOperation({ summary: 'Update product' })
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.updateAdminProduct(id, dto);
  }
}
