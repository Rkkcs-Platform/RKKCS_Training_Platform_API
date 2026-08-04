import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiPropertyOptional,
  ApiTags,
} from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { NewsStatus, UserRole } from '../common/enums';
import type { UserDocument } from '../schemas/user.schema';
import { CreateNewsDto, UpdateNewsDto } from './dto/create-news.dto';
import { NewsService } from './news.service';

class AdminNewsListQuery extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: NewsStatus })
  @IsOptional()
  @IsEnum(NewsStatus)
  status?: NewsStatus;
}

@ApiTags('Admin - News')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin/news')
export class AdminNewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get()
  @ApiOperation({ summary: 'List all news (admin)' })
  findAll(@Query() query: AdminNewsListQuery) {
    return this.newsService.findAdminAll(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create news article' })
  create(@Body() dto: CreateNewsDto, @CurrentUser() user: UserDocument) {
    return this.newsService.create(dto, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update news article' })
  update(@Param('id') id: string, @Body() dto: UpdateNewsDto) {
    return this.newsService.update(id, dto);
  }
}
