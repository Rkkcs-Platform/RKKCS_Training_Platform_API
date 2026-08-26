import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class ResubmitCodeDto {
  @ApiProperty({ example: 1, description: 'Order number of the wrong answer to replace' })
  @IsInt()
  @Min(1)
  order: number;

  @ApiProperty({ example: 'AVBCOMMN', description: 'New code to replace the wrong answer' })
  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  @MaxLength(16)
  code: string;
}
