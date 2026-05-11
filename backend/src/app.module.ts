import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { BalancesModule } from './balances/balances.module';
import { CompaniesModule } from './companies/companies.module';
import { MailModule } from './mail/mail.module';
import { MarketDataModule } from './market-data/market-data.module';
import { MatchingEngineModule } from './matching-engine/matching-engine.module';
import { OrdersModule } from './orders/orders.module';
import { PortfoliosModule } from './portfolios/portfolios.module';
import { PrismaModule } from './prisma/prisma.module';
import { StocksModule } from './stocks/stocks.module';
import { TradesModule } from './trades/trades.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    PrismaModule,
    MailModule,
    AuthModule,
    UsersModule,
    CompaniesModule,
    StocksModule,
    BalancesModule,
    PortfoliosModule,
    OrdersModule,
    TradesModule,
    MarketDataModule,
    MatchingEngineModule,
  ],
})
export class AppModule {}
