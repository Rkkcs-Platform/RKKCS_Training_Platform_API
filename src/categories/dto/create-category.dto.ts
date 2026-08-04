import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { CategoryStatus } from '../../common/enums';

export class CreateCategoryDto {
  @ApiProperty({ example: 'OPS' })
  @IsString()
  @MinLength(2)
  @MaxLength(32)
  categoryCode: string;

  @ApiProperty({ example: 'Vận hành' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  shopId?: string;

  @ApiPropertyOptional({ enum: CategoryStatus })
  @IsOptional()
  @IsEnum(CategoryStatus)
  status?: CategoryStatus;
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
