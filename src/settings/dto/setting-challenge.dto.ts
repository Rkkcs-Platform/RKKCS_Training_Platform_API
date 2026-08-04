import { IsBoolean, IsNumber, IsString, Min } from 'class-validator';

export class UpdateChallengeSettingDto {
  @IsNumber()
  @Min(1)
  codeCount: number;

  @IsNumber()
  @Min(1)
  codeLength: number;

  @IsString()
  generateTime: string;

  @IsBoolean()
  isAutoRandomCodeCount: boolean;
}

export class ToggleMaintenanceDto {
  @IsBoolean()
  enabled: boolean;
}