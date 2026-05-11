import { Module } from '@nestjs/common';
import { MarketDataGateway } from './market-data/market-data.gateway';

@Module({
  providers: [MarketDataGateway],
  exports: [MarketDataGateway],
})
export class MarketDataModule {}
