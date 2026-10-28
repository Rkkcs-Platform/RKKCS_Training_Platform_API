import {
  IsBoolean,
  IsIn,
  IsNumber,
  IsString,
  Matches,
  Min,
  ValidateIf,
} from 'class-validator';

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

  /** End time today as HH:mm (Asia/Ho_Chi_Minh). Required when enabling. */
  @ValidateIf((dto: ToggleMaintenanceDto) => dto.enabled === true)
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, {
    message: 'until must be HH:mm',
  })
  until?: string;
}

export class SetLanguageDto {
  @IsString()
  @IsIn(['vi', 'en', 'ja'])
  language: string;
}