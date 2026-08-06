import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { PosPaymentMethod } from '../../../common/enums/pos-payment-method.enum';

export class CreatePosProductDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiProperty({ example: 250 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ description: 'Omit or null for unlimited stock' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  shopId?: string;
}

export class UpdatePosProductDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sku?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  image?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class PosProductQueryDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  shopId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  activeOnly?: boolean;
}

export class CreatePosSaleItemDto {
  @ApiProperty()
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreatePosSaleDto {
  @ApiProperty({ type: [CreatePosSaleItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePosSaleItemDto)
  items: CreatePosSaleItemDto[];

  @ApiPropertyOptional({ enum: PosPaymentMethod })
  @IsOptional()
  @IsEnum(PosPaymentMethod)
  paymentMethod?: PosPaymentMethod;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  discount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  shopId?: string;
}

export class PosSaleQueryDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  shopId?: string;
}
