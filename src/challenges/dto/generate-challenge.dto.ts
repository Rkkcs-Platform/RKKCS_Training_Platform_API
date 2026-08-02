import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class GenerateChallengeDto {
  @ApiProperty({ example: '2026-06-09' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date must be in YYYY-MM-DD format',
  })
  date: string;

  @ApiPropertyOptional({
    example: '665f1a2b3c4d5e6f7a8b9c0d',
    description: 'Optional shop ID. Defaults to DEFAULT shop.',
  })
  @IsOptional()
  @IsMongoId()
  shopId?: string;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  codeCount?: number;

  @ApiPropertyOptional({ example: 8 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(4)
  @Max(16)
  codeLength?: number;
}
