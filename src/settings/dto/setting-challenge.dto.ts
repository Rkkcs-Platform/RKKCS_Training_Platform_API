import { IsBoolean, IsIn, IsNumber, IsString, Min } from 'class-validator';

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

export class SetLanguageDto {
  @IsString()
  @IsIn(['vi', 'en', 'ja'])
  language: string;
}