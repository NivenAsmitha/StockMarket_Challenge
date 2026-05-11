import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

type StockRoomResponse = {
  event: string;
  data: {
    symbol: string;
  };
};

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:5173',
    credentials: true,
  },
})
export class MarketDataGateway {
  @WebSocketServer()
  server!: Server;

  @SubscribeMessage('joinStockRoom')
  async joinStockRoom(
    @MessageBody() data: { symbol: string },
    @ConnectedSocket() client: Socket,
  ): Promise<StockRoomResponse> {
    const symbol = data.symbol.toUpperCase();

    await client.join(`stock:${symbol}`);

    return {
      event: 'joinedStockRoom',
      data: { symbol },
    };
  }

  @SubscribeMessage('leaveStockRoom')
  async leaveStockRoom(
    @MessageBody() data: { symbol: string },
    @ConnectedSocket() client: Socket,
  ): Promise<StockRoomResponse> {
    const symbol = data.symbol.toUpperCase();

    await client.leave(`stock:${symbol}`);

    return {
      event: 'leftStockRoom',
      data: { symbol },
    };
  }

  emitOrderBook(symbol: string, data: unknown): void {
    this.server
      .to(`stock:${symbol.toUpperCase()}`)
      .emit('orderbook:update', data);
  }

  emitTrade(symbol: string, data: unknown): void {
    this.server.to(`stock:${symbol.toUpperCase()}`).emit('trade:new', data);
  }

  emitStockPrice(symbol: string, data: unknown): void {
    this.server
      .to(`stock:${symbol.toUpperCase()}`)
      .emit('stock:price:update', data);
  }
}
