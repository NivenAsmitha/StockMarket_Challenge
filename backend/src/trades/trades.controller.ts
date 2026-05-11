import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TradesService } from './trades.service';

@ApiTags('Trades')
@Controller('trades')
export class TradesController {
  constructor(private readonly tradesService: TradesService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.tradesService.findMine(user.id);
  }

  @Get('recent/:symbol')
  recentBySymbol(@Param('symbol') symbol: string) {
    return this.tradesService.recentBySymbol(symbol);
  }
}
