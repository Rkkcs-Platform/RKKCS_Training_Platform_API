import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';
import { UpdateChallengeSettingDto, ToggleMaintenanceDto } from './dto/setting-challenge.dto';
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

  @Get('maintenance')
  @ApiOperation({ summary: 'Get maintenance mode status' })
  getMaintenanceStatus() {
    return this.settingService.getMaintenanceStatus();
  }

  @Patch('maintenance')
  @ApiOperation({ summary: 'Toggle maintenance mode' })
  setMaintenanceMode(@Body() body: ToggleMaintenanceDto) {
    return this.settingService.setMaintenanceMode(body.enabled);
  }
}
