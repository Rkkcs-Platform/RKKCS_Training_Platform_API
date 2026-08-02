import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';
import { ProcessingService } from './processing.service';

class ReprocessBatchDto {
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  force?: boolean;
}

@ApiTags('Admin - Batches')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin/batches')
export class AdminBatchesController {
  constructor(private readonly processingService: ProcessingService) {}

  @Post(':challengeId/reprocess')
  @ApiOperation({ summary: 'Reprocess batch into orders/payments/shipments' })
  reprocess(
    @Param('challengeId') challengeId: string,
    @Body() dto: ReprocessBatchDto,
  ) {
    return this.processingService.processBatch(challengeId, {
      force: dto?.force,
    });
  }
}
