import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ListingStatus } from '../../../common/enums/listing-status.enum';
import { PriceUnit } from '../../../common/enums/price-unit.enum';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class CreateServiceDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 1500 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ enum: PriceUnit })
  @IsOptional()
  @IsEnum(PriceUnit)
  priceUnit?: PriceUnit;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  cityId?: string;

  @ApiPropertyOptional({ description: 'Shop id (preferred)' })
  @IsOptional()
  @IsUUID()
  shopId?: string;

  @ApiPropertyOptional({ description: 'Alias of shopId' })
  @IsOptional()
  @IsUUID()
  businessId?: string;

  @ApiPropertyOptional({ enum: ListingStatus })
  @IsOptional()
  @IsEnum(ListingStatus)
  status?: ListingStatus;
}

export class UpdateServiceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(3)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ enum: PriceUnit })
  @IsOptional()
  @IsEnum(PriceUnit)
  priceUnit?: PriceUnit;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  cityId?: string;

  @ApiPropertyOptional({ enum: ListingStatus })
  @IsOptional()
  @IsEnum(ListingStatus)
  status?: ListingStatus;
}

export class ServiceQueryDto extends PaginationDto {
  @ApiPropertyOptional({ enum: ListingStatus })
  @IsOptional()
  @IsEnum(ListingStatus)
  status?: ListingStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  cityId?: string;

  @ApiPropertyOptional({ description: 'Shop id (preferred)' })
  @IsOptional()
  @IsUUID()
  shopId?: string;

  @ApiPropertyOptional({ description: 'Alias of shopId' })
  @IsOptional()
  @IsUUID()
  businessId?: string;
}
