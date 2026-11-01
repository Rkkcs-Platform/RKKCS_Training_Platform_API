import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsInt, Min } from 'class-validator';

export class DeleteAnswersDto {
  @ApiProperty({
    description: 'Answer order numbers to delete',
    type: [Number],
    example: [1, 3, 5],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  @Min(1, { each: true })
  orders!: number[];
}
