import { Body, Controller, Get, Post } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateChallengeSettingDto } from './dto/setting-challenge.dto';

@Controller('setting')
export class SettingChallengeController {
    constructor(private readonly settingService: SettingsService) {}
  @Get('default')
  getSettingChallenge() {
    return this.settingService.getDefaultSettings();
  }

  @Post('update')
  updateSettingChallenge(@Body() setting: UpdateChallengeSettingDto) {
    return this.settingService.updateSettingChallenge(setting);
  }
}