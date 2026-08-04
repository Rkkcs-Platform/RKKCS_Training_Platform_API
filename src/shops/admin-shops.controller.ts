import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { UserRole } from '../common/enums';
import { CreateShopDto } from './dto/create-shop.dto';
import { EnsureShopForUserDto } from './dto/ensure-shop-for-user.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import { ShopsService } from './shops.service';

@ApiTags('Admin - Shops')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin/shops')
export class AdminShopsController {
  constructor(private readonly shopsService: ShopsService) {}

  @Get()
  @ApiOperation({ summary: 'List shops' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.shopsService.findAll(query);
  }

  @Get('users')
  @ApiOperation({
    summary: 'List shop-owner users and their shopId (for attaching shops)',
  })
  listUsers() {
    return this.shopsService.listShopUsers();
  }

  @Post()
  @ApiOperation({ summary: 'Create shop' })
  create(@Body() dto: CreateShopDto) {
    return this.shopsService.create(dto);
  }

  @Post('ensure-for-user')
  @ApiOperation({
    summary:
      'Create a dedicated shop for an existing user (keeps the account, moves off DEFAULT if needed)',
  })
  ensureForUser(@Body() dto: EnsureShopForUserDto) {
    return this.shopsService.ensureShopForUser(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get shop by ID' })
  async findOne(@Param('id') id: string) {
    const shop = await this.shopsService.findById(id);
    return this.shopsService.toResponse(shop);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update shop' })
  update(@Param('id') id: string, @Body() dto: UpdateShopDto) {
    return this.shopsService.update(id, dto);
  }
}
