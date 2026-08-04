import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiPropertyOptional,
  ApiTags,
} from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { UserDocument } from '../schemas/user.schema';
import { ShopsService } from '../shops/shops.service';
import { ReportsService } from './reports.service';

class ShopStatsQuery {
  @ApiPropertyOptional({ default: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(90)
  days?: number;
}

@ApiTags('Statistics')
@ApiBearerAuth()
@Controller('statistics')
export class StatisticsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly shopsService: ShopsService,
  ) {}

  @Get('revenue')
  @ApiOperation({ summary: 'Shop owner revenue statistics' })
  async revenue(
    @CurrentUser() user: UserDocument,
    @Query() query: ShopStatsQuery,
  ) {
    const shopId = await this.shopsService.resolveShopIdForUser(user);
    return this.reportsService.getShopRevenueStats(shopId, query.days);
  }

  @Get('orders')
  @ApiOperation({ summary: 'Shop owner order statistics by status' })
  async orders(@CurrentUser() user: UserDocument) {
    const shopId = await this.shopsService.resolveShopIdForUser(user);
    return this.reportsService.getShopOrdersStats(shopId);
  }
}
