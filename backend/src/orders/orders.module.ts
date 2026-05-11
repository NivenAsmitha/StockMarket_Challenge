import { Module } from '@nestjs/common';
import { MatchingEngineModule } from '../matching-engine/matching-engine.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [MatchingEngineModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
