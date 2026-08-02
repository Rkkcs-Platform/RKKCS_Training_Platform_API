import { ApiProperty } from '@nestjs/swagger';
import {
  IsMongoId,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class EnsureShopForUserDto {
  @ApiProperty({ example: '665f1a2b3c4d5e6f7a8b9c0d' })
  @IsMongoId()
  userId: string;

  @ApiProperty({ example: 'SHOP001' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(32)
  shopCode: string;

  @ApiProperty({ example: 'Chi nhánh Hà Nội' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  shopName: string;
}
