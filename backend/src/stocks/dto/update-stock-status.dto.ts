import { StockStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateStockStatusDto {
  @IsEnum(StockStatus)
  status!: StockStatus;
}
