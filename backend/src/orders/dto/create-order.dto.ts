import { OrderSide, OrderType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  stockSymbol!: string;

  @IsEnum(OrderSide)
  side!: OrderSide;

  @IsEnum(OrderType)
  type!: OrderType;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  price?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity!: number;
}
