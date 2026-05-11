import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { BalancesService } from './balances.service';
import { DepositBalanceDto } from './dto/deposit-balance.dto';

@ApiTags('Balances')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('balances')
export class BalancesController {
  constructor(private readonly balancesService: BalancesService) {}

  @Get('me')
  findMe(@CurrentUser() user: AuthenticatedUser) {
    return this.balancesService.findMe(user.id);
  }

  @Post('deposit')
  deposit(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: DepositBalanceDto,
  ) {
    return this.balancesService.deposit(user.id, dto);
  }
}
