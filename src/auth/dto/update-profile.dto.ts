import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Nguyen Van A' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.png' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatar?: string;
}

export class ChangePasswordDto {
  @ApiProperty({ example: 'oldpassword' })
  @IsString()
  @MinLength(6)
  @MaxLength(64)
  currentPassword: string;

  @ApiProperty({ example: 'newpassword' })
  @IsString()
  @MinLength(6)
  @MaxLength(64)
  newPassword: string;
}
