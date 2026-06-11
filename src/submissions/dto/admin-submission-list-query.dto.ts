import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, Matches } from 'class-validator';
import { SubmissionStatus } from '../../common/enums';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class AdminSubmissionListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: '2026-06-09' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date?: string;

  @ApiPropertyOptional({ enum: SubmissionStatus })
  @IsOptional()
  @IsEnum(SubmissionStatus)
  status?: SubmissionStatus;
}
