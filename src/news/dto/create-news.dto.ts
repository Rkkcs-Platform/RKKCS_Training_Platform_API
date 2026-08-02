import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { NewsStatus } from '../../common/enums';

export class CreateNewsDto {
  @ApiProperty({ example: 'Ra mắt RKKCS Operations Platform' })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({
    example: 'ra-mat-rkkcs-operations-platform',
    description: 'Auto-generated from title if omitted',
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(220)
  slug?: string;

  @ApiProperty({ example: 'Tóm tắt ngắn về bản cập nhật...' })
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  summary: string;

  @ApiProperty({ example: 'Nội dung chi tiết...' })
  @IsString()
  @MinLength(20)
  content: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverImageUrl?: string;

  @ApiPropertyOptional({ enum: NewsStatus })
  @IsOptional()
  @IsEnum(NewsStatus)
  status?: NewsStatus;
}

export class UpdateNewsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(220)
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  summary?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(20)
  content?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverImageUrl?: string;

  @ApiPropertyOptional({ enum: NewsStatus })
  @IsOptional()
  @IsEnum(NewsStatus)
  status?: NewsStatus;
}
