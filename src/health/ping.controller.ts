import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Health')
@Controller('ping')
export class PingController {
  @Public()
  @Get()
  @ApiOperation({ summary: 'Keep-alive ping' })
  ping() {
    return 'ok';
  }
}
