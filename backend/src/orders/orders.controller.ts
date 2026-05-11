import {
  Body,
  Controller,
  Delete,
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
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(user.id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin/all')
  adminFindAll() {
    return this.ordersService.adminFindAll();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id/approve')
  approveOrder(@Param('id') id: string) {
    return this.ordersService.approveOrder(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id/reject')
  rejectOrder(@Param('id') id: string) {
    return this.ordersService.rejectOrder(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.ordersService.findMine(user.id);
  }

  @Get('orderbook/:symbol')
  getOrderBook(@Param('symbol') symbol: string) {
    return this.ordersService.getOrderBook(symbol);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.ordersService.findOne(user.id, id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id/cancel')
  cancel(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.ordersService.cancel(user.id, id);
  }
}
