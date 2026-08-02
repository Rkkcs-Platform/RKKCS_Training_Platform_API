import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiPropertyOptional,
  ApiTags,
} from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsMongoId, IsOptional, IsString, Max, Min } from 'class-validator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';
import { ReportsService } from './reports.service';

class RevenueReportQuery {
  @ApiPropertyOptional({ default: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(90)
  days?: number;
}

class TransactionCodesQuery {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;

  @ApiPropertyOptional({ example: '2026-07-19' })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  shopId?: string;

  @ApiPropertyOptional({ description: 'Search by code' })
  @IsOptional()
  @IsString()
  q?: string;
}

@ApiTags('Admin - Dashboard')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin/dashboard')
export class AdminDashboardController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @ApiOperation({ summary: 'Platform-wide admin dashboard KPIs' })
  getDashboard() {
    return this.reportsService.getAdminDashboard();
  }
}

@ApiTags('Admin - Reports')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin/reports')
export class AdminReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('revenue')
  @ApiOperation({ summary: 'Revenue report across shops' })
  revenue(@Query() query: RevenueReportQuery) {
    return this.reportsService.getAdminRevenueReport(query.days);
  }

  @Get('orders')
  @ApiOperation({ summary: 'Orders report by status' })
  orders() {
    return this.reportsService.getAdminOrdersReport();
  }
}

@ApiTags('Admin - Transaction Codes')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin/transaction-codes')
export class AdminTransactionCodesController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @ApiOperation({
    summary: 'Monitor transaction codes across batches (usage status)',
  })
  list(@Query() query: TransactionCodesQuery) {
    return this.reportsService.getAdminTransactionCodes(query);
  }
}
