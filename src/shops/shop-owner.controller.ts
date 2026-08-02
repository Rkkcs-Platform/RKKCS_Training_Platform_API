import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { UserDocument } from '../schemas/user.schema';
import { ShopsService } from './shops.service';

class UpdateMyShopDto {
  @ApiPropertyOptional({ example: 'My Shop Name' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  shopName?: string;
}

@ApiTags('Shop')
@ApiBearerAuth()
@Controller('shop')
export class ShopOwnerController {
  constructor(private readonly shopsService: ShopsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current shop owner shop profile' })
  getMyShop(@CurrentUser() user: UserDocument) {
    return this.shopsService.getShopForOwner(user);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current shop name' })
  updateMyShop(
    @CurrentUser() user: UserDocument,
    @Body() dto: UpdateMyShopDto,
  ) {
    return this.shopsService.updateShopForOwner(user, dto);
  }
}
