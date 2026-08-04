import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { OrderStatus, ShipmentStatus } from '../../common/enums';

class UpdateOrderCustomerDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  fullName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  email?: string;
}

class UpdateOrderShipmentDto {
  @ApiPropertyOptional({ enum: ShipmentStatus })
  @IsOptional()
  @IsEnum(ShipmentStatus)
  status?: ShipmentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  carrier?: string;

  @ApiPropertyOptional({
    description:
      'Vị trí hiện tại (đường/số nhà để geocode chính xác, VD: 1 Chome-1-2 Shibuya, Tokyo)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(400)
  currentLocation?: string;

  @ApiPropertyOptional({
    description:
      'Địa chỉ giao hàng chi tiết (đường/số nhà). API geocode qua Nominatim khi đủ chi tiết.',
    example: '1 Chome-1-2 Shibuya, Shibuya City, Tokyo 150-0002',
  })
  @IsOptional()
  @IsString()
  @MaxLength(400)
  deliveryAddress?: string;

  @ApiPropertyOptional({ description: 'Ghi chú tracking' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;

  @ApiPropertyOptional({
    description: 'City id for current package location (from GET /map/cities)',
    example: 'jp-tokyo',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  currentCityId?: string;

  @ApiPropertyOptional({
    description: 'City id for delivery destination (from GET /map/cities)',
    example: 'jp-osaka',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  destCityId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  eta?: string;
}

class UpdateOrderItemDto {
  @ApiPropertyOptional()
  @IsMongoId()
  productId: string;

  @ApiPropertyOptional({ minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;
}

export class UpdateOrderDto {
  @ApiPropertyOptional({ enum: OrderStatus })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({ type: UpdateOrderCustomerDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateOrderCustomerDto)
  customer?: UpdateOrderCustomerDto;

  @ApiPropertyOptional({ type: UpdateOrderShipmentDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateOrderShipmentDto)
  shipment?: UpdateOrderShipmentDto;

  @ApiPropertyOptional({
    type: [UpdateOrderItemDto],
    description: 'Thay thế toàn bộ sản phẩm trong đơn',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateOrderItemDto)
  items?: UpdateOrderItemDto[];
}
