import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class SubmitCodeDto {
  @ApiProperty({ example: 'AVBCOMMN' })
  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  @MaxLength(16)
  code: string;
}
