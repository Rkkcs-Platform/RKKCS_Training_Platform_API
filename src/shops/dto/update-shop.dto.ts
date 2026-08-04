import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ShopStatus } from '../../common/enums';

export class UpdateShopDto {
  @ApiPropertyOptional({ example: 'RKKCS Demo Shop' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  shopName?: string;

  @ApiPropertyOptional({ example: 'SHOP001' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(32)
  shopCode?: string;

  @ApiPropertyOptional({ example: '665f1a2b3c4d5e6f7a8b9c0d' })
  @IsOptional()
  @IsMongoId()
  ownerId?: string;

  @ApiPropertyOptional({ enum: ShopStatus })
  @IsOptional()
  @IsEnum(ShopStatus)
  status?: ShopStatus;
}
