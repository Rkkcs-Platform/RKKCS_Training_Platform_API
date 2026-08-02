import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';
import { UpdateChallengeSettingDto } from './dto/setting-challenge.dto';
import { SettingsService } from './settings.service';

@ApiTags('Admin - Settings')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin/settings')
export class AdminSettingsController {
  constructor(private readonly settingService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get platform / challenge generation settings' })
  getSettings() {
    return this.settingService.getDefaultSettings();
  }

  @Patch()
  @ApiOperation({ summary: 'Update platform / challenge generation settings' })
  updateSettings(@Body() setting: UpdateChallengeSettingDto) {
    return this.settingService.updateSettingChallenge(setting);
  }
}
