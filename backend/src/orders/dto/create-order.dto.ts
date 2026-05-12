import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderSide, OrderType } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({
    example: 'SPC',
  })
  @IsString()
  stockSymbol!: string;

  @ApiProperty({
    enum: OrderSide,
    example: OrderSide.BUY,
  })
  @IsEnum(OrderSide)
  side!: OrderSide;

  @ApiProperty({
    enum: OrderType,
    example: OrderType.LIMIT,
  })
  @IsEnum(OrderType)
  type!: OrderType;

  @ApiPropertyOptional({
    example: 100,
  })
  @ValidateIf((dto: CreateOrderDto) => dto.type === OrderType.LIMIT)
  @IsNumber()
  @Min(0.01)
  price?: number;

  @ApiProperty({
    example: 1,
  })
  @IsNumber()
  @Min(0.01)
  quantity!: number;

  @ApiPropertyOptional({
    example: true,
    description:
      'Use true for company/market trades that need admin approval. Use false for user-to-user selling stocks.',
  })
  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean;
}
