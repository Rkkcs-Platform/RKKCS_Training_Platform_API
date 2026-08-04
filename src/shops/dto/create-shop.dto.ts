import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ShopStatus } from '../../common/enums';

export class CreateShopDto {
  @ApiProperty({ example: 'SHOP001' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(32)
  shopCode: string;

  @ApiProperty({ example: 'RKKCS Demo Shop' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  shopName: string;

  @ApiProperty({ example: '665f1a2b3c4d5e6f7a8b9c0d' })
  @IsMongoId()
  ownerId: string;

  @ApiPropertyOptional({ enum: ShopStatus, default: ShopStatus.ACTIVE })
  @IsOptional()
  @IsEnum(ShopStatus)
  status?: ShopStatus;
}
