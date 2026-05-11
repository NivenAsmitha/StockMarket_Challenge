import { Injectable } from '@nestjs/common';
import {
  OrderSide,
  OrderStatus,
  OrderType,
  Prisma,
  Trade,
} from '@prisma/client';
import { MarketDataGateway } from '../market-data/market-data/market-data.gateway';

@Injectable()
export class MatchingEngineService {
  constructor(private readonly marketDataGateway: MarketDataGateway) {}

  async matchOrder(tx: Prisma.TransactionClient, incomingOrderId: string) {
    const incomingOrder = await tx.order.findUnique({
      where: { id: incomingOrderId },
      include: {
        stock: true,
      },
    });

    if (!incomingOrder) {
      return;
    }

    if (
      incomingOrder.status !== OrderStatus.OPEN &&
      incomingOrder.status !== OrderStatus.PARTIALLY_FILLED
    ) {
      return;
    }

    let currentIncomingOrder = incomingOrder;

    while (new Prisma.Decimal(currentIncomingOrder.remainingQty).gt(0)) {
      const oppositeOrder = await this.findMatchingOppositeOrder(
        tx,
        currentIncomingOrder,
      );

      if (!oppositeOrder) {
        break;
      }

      const incomingRemaining = new Prisma.Decimal(
        currentIncomingOrder.remainingQty,
      );
      const oppositeRemaining = new Prisma.Decimal(oppositeOrder.remainingQty);

      const tradeQuantity = incomingRemaining.lessThan(oppositeRemaining)
        ? incomingRemaining
        : oppositeRemaining;

      if (!oppositeOrder.price) {
        break;
      }

      const tradePrice = new Prisma.Decimal(oppositeOrder.price);
      const tradeTotal = tradePrice.mul(tradeQuantity);

      const buyOrder =
        currentIncomingOrder.side === OrderSide.BUY
          ? currentIncomingOrder
          : oppositeOrder;

      const sellOrder =
        currentIncomingOrder.side === OrderSide.SELL
          ? currentIncomingOrder
          : oppositeOrder;

      const buyerId = buyOrder.userId;
      const sellerId = sellOrder.userId;

      const trade = await tx.trade.create({
        data: {
          stockId: currentIncomingOrder.stockId,
          buyerId,
          sellerId,
          buyOrderId: buyOrder.id,
          sellOrderId: sellOrder.id,
          price: tradePrice,
          quantity: tradeQuantity,
          total: tradeTotal,
        },
      });

      await this.updateBuyerBalance(tx, buyerId, tradeTotal);
      await this.updateSellerBalance(tx, sellerId, tradeTotal);

      await this.updateBuyerPortfolio(
        tx,
        buyerId,
        currentIncomingOrder.stockId,
        tradeQuantity,
        tradePrice,
      );

      await this.updateSellerPortfolio(
        tx,
        sellerId,
        currentIncomingOrder.stockId,
        tradeQuantity,
      );

      await this.updateOrderAfterTrade(tx, buyOrder.id, tradeQuantity);
      await this.updateOrderAfterTrade(tx, sellOrder.id, tradeQuantity);

      await tx.stock.update({
        where: {
          id: currentIncomingOrder.stockId,
        },
        data: {
          lastPrice: tradePrice,
        },
      });

      this.emitTradeEvents(currentIncomingOrder.stock.symbol, trade);

      const refreshedIncomingOrder = await tx.order.findUnique({
        where: { id: incomingOrderId },
        include: {
          stock: true,
        },
      });

      if (!refreshedIncomingOrder) {
        break;
      }

      currentIncomingOrder = refreshedIncomingOrder;

      if (currentIncomingOrder.status === OrderStatus.FILLED) {
        break;
      }
    }

    await this.releaseExtraBuyerLockedMoney(tx, incomingOrderId);
    await this.emitOrderBook(currentIncomingOrder.stock.symbol, tx);
  }

  private async findMatchingOppositeOrder(
    tx: Prisma.TransactionClient,
    incomingOrder: {
      id: string;
      userId: string;
      stockId: string;
      side: OrderSide;
      type: OrderType;
      price: Prisma.Decimal | null;
    },
  ) {
    if (incomingOrder.side === OrderSide.BUY) {
      return tx.order.findFirst({
        where: {
          stockId: incomingOrder.stockId,
          side: OrderSide.SELL,
          userId: {
            not: incomingOrder.userId,
          },
          status: {
            in: [OrderStatus.OPEN, OrderStatus.PARTIALLY_FILLED],
          },
          price: incomingOrder.price
            ? {
                lte: incomingOrder.price,
                not: null,
              }
            : {
                not: null,
              },
        },
        orderBy: [{ price: 'asc' }, { createdAt: 'asc' }],
      });
    }

    return tx.order.findFirst({
      where: {
        stockId: incomingOrder.stockId,
        side: OrderSide.BUY,
        userId: {
          not: incomingOrder.userId,
        },
        status: {
          in: [OrderStatus.OPEN, OrderStatus.PARTIALLY_FILLED],
        },
        price: incomingOrder.price
          ? {
              gte: incomingOrder.price,
              not: null,
            }
          : {
              not: null,
            },
      },
      orderBy: [{ price: 'desc' }, { createdAt: 'asc' }],
    });
  }

  private async updateBuyerBalance(
    tx: Prisma.TransactionClient,
    buyerId: string,
    tradeTotal: Prisma.Decimal,
  ) {
    await tx.balance.update({
      where: {
        userId: buyerId,
      },
      data: {
        lockedLkr: {
          decrement: tradeTotal,
        },
      },
    });
  }

  private async updateSellerBalance(
    tx: Prisma.TransactionClient,
    sellerId: string,
    tradeTotal: Prisma.Decimal,
  ) {
    await tx.balance.update({
      where: {
        userId: sellerId,
      },
      data: {
        totalLkr: {
          increment: tradeTotal,
        },
        availableLkr: {
          increment: tradeTotal,
        },
      },
    });
  }

  private async updateBuyerPortfolio(
    tx: Prisma.TransactionClient,
    buyerId: string,
    stockId: string,
    tradeQuantity: Prisma.Decimal,
    tradePrice: Prisma.Decimal,
  ) {
    const existingPortfolio = await tx.portfolio.findUnique({
      where: {
        userId_stockId: {
          userId: buyerId,
          stockId,
        },
      },
    });

    if (!existingPortfolio) {
      await tx.portfolio.create({
        data: {
          userId: buyerId,
          stockId,
          quantity: tradeQuantity,
          lockedQuantity: new Prisma.Decimal(0),
          avgBuyPrice: tradePrice,
        },
      });

      return;
    }

    const oldQuantity = new Prisma.Decimal(existingPortfolio.quantity);
    const oldAvgBuyPrice = new Prisma.Decimal(existingPortfolio.avgBuyPrice);

    const newQuantity = oldQuantity.plus(tradeQuantity);

    const newAvgBuyPrice = oldQuantity
      .mul(oldAvgBuyPrice)
      .plus(tradeQuantity.mul(tradePrice))
      .div(newQuantity);

    await tx.portfolio.update({
      where: {
        userId_stockId: {
          userId: buyerId,
          stockId,
        },
      },
      data: {
        quantity: {
          increment: tradeQuantity,
        },
        avgBuyPrice: newAvgBuyPrice,
      },
    });
  }

  private async updateSellerPortfolio(
    tx: Prisma.TransactionClient,
    sellerId: string,
    stockId: string,
    tradeQuantity: Prisma.Decimal,
  ) {
    const updatedPortfolio = await tx.portfolio.update({
      where: {
        userId_stockId: {
          userId: sellerId,
          stockId,
        },
      },
      data: {
        lockedQuantity: {
          decrement: tradeQuantity,
        },
      },
    });

    const availableQuantity = new Prisma.Decimal(updatedPortfolio.quantity);
    const lockedQuantity = new Prisma.Decimal(updatedPortfolio.lockedQuantity);

    if (availableQuantity.lte(0) && lockedQuantity.lte(0)) {
      await tx.portfolio.delete({
        where: {
          userId_stockId: {
            userId: sellerId,
            stockId,
          },
        },
      });
    }
  }

  private async updateOrderAfterTrade(
    tx: Prisma.TransactionClient,
    orderId: string,
    tradeQuantity: Prisma.Decimal,
  ) {
    const order = await tx.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return;
    }

    const currentRemainingQty = new Prisma.Decimal(order.remainingQty);
    const newRemainingQty = currentRemainingQty.minus(tradeQuantity);

    const newStatus = newRemainingQty.lte(0)
      ? OrderStatus.FILLED
      : OrderStatus.PARTIALLY_FILLED;

    await tx.order.update({
      where: {
        id: orderId,
      },
      data: {
        remainingQty: newRemainingQty.lte(0)
          ? new Prisma.Decimal(0)
          : newRemainingQty,
        status: newStatus,
      },
    });
  }

  private async releaseExtraBuyerLockedMoney(
    tx: Prisma.TransactionClient,
    orderId: string,
  ) {
    const order = await tx.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return;
    }

    if (order.side !== OrderSide.BUY) {
      return;
    }

    if (order.status !== OrderStatus.FILLED) {
      return;
    }

    const lockedAmount = new Prisma.Decimal(order.lockedAmount);

    if (lockedAmount.lte(0)) {
      return;
    }

    const trades = await tx.trade.findMany({
      where: {
        buyOrderId: order.id,
      },
    });

    const usedAmount = trades.reduce(
      (sum, tradeItem) => sum.plus(new Prisma.Decimal(tradeItem.total)),
      new Prisma.Decimal(0),
    );

    const refundAmount = lockedAmount.minus(usedAmount);

    if (refundAmount.gt(0)) {
      await tx.balance.update({
        where: {
          userId: order.userId,
        },
        data: {
          lockedLkr: {
            decrement: refundAmount,
          },
          availableLkr: {
            increment: refundAmount,
          },
        },
      });
    }

    await tx.order.update({
      where: {
        id: order.id,
      },
      data: {
        lockedAmount: new Prisma.Decimal(0),
      },
    });
  }

  private emitTradeEvents(symbol: string, trade: Trade) {
    this.marketDataGateway.emitTrade(symbol, trade);
    this.marketDataGateway.emitStockPrice(symbol, {
      symbol,
      lastPrice: trade.price,
    });
  }

  private async emitOrderBook(symbol: string, tx: Prisma.TransactionClient) {
    const stock = await tx.stock.findUnique({
      where: {
        symbol,
      },
    });

    if (!stock) {
      return;
    }

    const buyOrders = await tx.order.findMany({
      where: {
        stockId: stock.id,
        side: OrderSide.BUY,
        status: {
          in: [OrderStatus.OPEN, OrderStatus.PARTIALLY_FILLED],
        },
        price: {
          not: null,
        },
      },
      orderBy: [{ price: 'desc' }, { createdAt: 'asc' }],
      take: 20,
    });

    const sellOrders = await tx.order.findMany({
      where: {
        stockId: stock.id,
        side: OrderSide.SELL,
        status: {
          in: [OrderStatus.OPEN, OrderStatus.PARTIALLY_FILLED],
        },
        price: {
          not: null,
        },
      },
      orderBy: [{ price: 'asc' }, { createdAt: 'asc' }],
      take: 20,
    });

    this.marketDataGateway.emitOrderBook(symbol, {
      symbol,
      stockId: stock.id,
      buyOrders,
      sellOrders,
    });
  }
}
