import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
} from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import {
  getMockMapRegion,
  listMockCities,
  type MockMapRegion,
} from '../common/utils';
import { GeocodeService } from './geocode.service';

class MapCitiesQuery {
  @ApiPropertyOptional({ enum: ['japan', 'vietnam'] })
  @IsOptional()
  @IsIn(['japan', 'vietnam'])
  region?: MockMapRegion;
}

class GeocodeQuery {
  @ApiProperty({
    example: '1 Chome-1-2 Shibuya, Shibuya City, Tokyo 150-0002',
  })
  @IsString()
  @MinLength(5)
  q: string;

  @ApiPropertyOptional({ enum: ['jp', 'vn'] })
  @IsOptional()
  @IsIn(['jp', 'vn'])
  country?: 'jp' | 'vn';
}

@ApiTags('Map')
@ApiBearerAuth()
@Controller('map')
export class MapController {
  constructor(private readonly geocodeService: GeocodeService) {}

  @Get('cities')
  @ApiOperation({
    summary:
      'List mock cities with lat/lng for shipment map (static catalog, not live geocode)',
  })
  listCities(@Query() query: MapCitiesQuery) {
    const region = query.region ?? getMockMapRegion();
    return {
      region,
      source:
        'Static curated city centers (OpenStreetMap/public coordinates). Not a live geocoding API.',
      items: listMockCities(region).map((city) => ({
        id: city.id,
        name: city.name,
        region: city.region,
        lat: city.lat,
        lng: city.lng,
      })),
    };
  }

  @Get('geocode')
  @ApiOperation({
    summary:
      'Geocode street/house address via OpenStreetMap Nominatim (free, rate-limited)',
  })
  async geocode(@Query() query: GeocodeQuery) {
    const region = getMockMapRegion();
    const country =
      query.country ?? (region === 'vietnam' ? 'vn' : 'jp');
    const result = await this.geocodeService.geocodeAddress(query.q, country);

    return {
      query: query.q,
      country,
      found: Boolean(result),
      result,
      note: result
        ? 'Street-level pin from Nominatim (accuracy depends on OSM data).'
        : 'No match — try fuller address (street + city + postal code).',
    };
  }
}
