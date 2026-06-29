import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export enum SaleType {
  DIRECT = 'DIRECT',
  AUCTION = 'AUCTION',
}
export enum Sex {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  MIXED = 'MIXED',
}

export class HealthAttrDto {
  @IsString() key: string;
  @IsBoolean() value: boolean;
  @IsOptional() @IsString() note?: string;
}

export class MediaDto {
  @IsString() url: string;
  @IsOptional() @IsString() type?: 'IMAGE' | 'VIDEO' | 'VIDEO_360' | 'DOC';
}

export class AuctionConfigDto {
  @IsNumber() startPrice: number;
  @IsOptional() @IsNumber() minIncrement?: number;
  @IsOptional() @IsNumber() reservePrice?: number;
  @IsOptional() @IsNumber() deposit?: number;
  @IsOptional() @IsInt() durationHours?: number; // مدة المزاد بالساعات من الآن
}

export class CreateListingDto {
  @IsString() title: string;
  @IsString() description: string;
  @IsString() categoryId: string;

  @IsOptional() @IsInt() @Min(1) count?: number;
  @IsOptional() @IsEnum(Sex) sex?: Sex;
  @IsOptional() @IsInt() approxWeightKg?: number;
  @IsOptional() @IsString() productionStatus?: string;

  @IsEnum(SaleType) saleType: SaleType;
  @IsOptional() @IsNumber() price?: number; // للبيع المباشر

  @IsString() city: string;
  @IsString() region: string;
  @IsOptional() @IsNumber() lat?: number;
  @IsOptional() @IsNumber() lng?: number;
  @IsOptional() @IsBoolean() hidePhone?: boolean;

  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => HealthAttrDto)
  health?: HealthAttrDto[];

  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => MediaDto)
  media?: MediaDto[];

  @IsOptional() @ValidateNested() @Type(() => AuctionConfigDto)
  auction?: AuctionConfigDto;
}

export class SearchListingsDto {
  @IsOptional() @IsString() q?: string;
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsString() region?: string;
  @IsOptional() @IsEnum(SaleType) saleType?: SaleType;
  @IsOptional() @Type(() => Number) @IsNumber() lat?: number;
  @IsOptional() @Type(() => Number) @IsNumber() lng?: number;
  @IsOptional() @Type(() => Number) @IsInt() page?: number;
}
