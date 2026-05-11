import { Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateStockDto {
  @IsString()
  companyId!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(10)
  symbol!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  totalShares!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  initialPrice?: number;
}
