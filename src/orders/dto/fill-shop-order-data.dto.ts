import { IsMongoId, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FillShopOrderDataDto {
  @ApiPropertyOptional({
    description:
      'Shop to fill. Omit to fill every active shop (name/email/phone + catalog products).',
  })
  @IsOptional()
  @IsMongoId()
  shopId?: string;
}
