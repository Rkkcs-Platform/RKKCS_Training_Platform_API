import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { NewsService } from './news.service';

@ApiTags('News')
@ApiBearerAuth()
@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get()
  @ApiOperation({ summary: 'List published news' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.newsService.findPublished(query);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get published news by slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.newsService.findPublishedBySlug(slug);
  }
}
