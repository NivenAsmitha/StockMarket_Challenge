import { Module } from '@nestjs/common';
import { MarketDataModule } from '../market-data/market-data.module';
import { MatchingEngineService } from './matching-engine.service';

@Module({
  imports: [MarketDataModule],
  providers: [MatchingEngineService],
  exports: [MatchingEngineService],
})
export class MatchingEngineModule {}
