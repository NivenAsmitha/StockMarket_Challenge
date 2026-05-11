import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PortfoliosService } from './portfolios.service';

@ApiTags('Portfolios')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('portfolios')
export class PortfoliosController {
  constructor(private readonly portfoliosService: PortfoliosService) {}

  @Get('me')
  findMe(@CurrentUser() user: AuthenticatedUser) {
    return this.portfoliosService.findMine(user.id);
  }

  @Get('summary')
  getPortfolioSummary(@CurrentUser() user: AuthenticatedUser) {
    return this.portfoliosService.summary(user.id);
  }

  @Get(':symbol')
  findBySymbol(
    @CurrentUser() user: AuthenticatedUser,
    @Param('symbol') symbol: string,
  ) {
    return this.portfoliosService.findBySymbol(user.id, symbol);
  }
}
