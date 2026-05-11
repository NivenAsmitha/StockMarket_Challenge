import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateStockDto } from './dto/create-stock.dto';
import { UpdateStockStatusDto } from './dto/update-stock-status.dto';
import { StocksService } from './stocks.service';

@ApiTags('Stocks')
@Controller('stocks')
export class StocksController {
  constructor(private readonly stocksService: StocksService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateStockDto) {
    return this.stocksService.create(user.id, dto);
  }

  @Get()
  findAll() {
    return this.stocksService.findAll();
  }

  @Get('active')
  findActive() {
    return this.stocksService.findActive();
  }

  @Get('symbol/:symbol')
  findBySymbol(@Param('symbol') symbol: string) {
    return this.stocksService.findBySymbol(symbol);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.stocksService.findById(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStockStatusDto) {
    return this.stocksService.updateStatus(id, dto);
  }
}
