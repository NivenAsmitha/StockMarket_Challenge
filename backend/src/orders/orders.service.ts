import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OrderSide,
  OrderStatus,
  OrderType,
  Prisma,
  StockStatus,
} from '@prisma/client';
import { MatchingEngineService } from '../matching-engine/matching-engine.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

const PENDING_APPROVAL = 'PENDING_APPROVAL' as const;

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly matchingEngine: MatchingEngineService,
  ) {}

  async create(userId: string, dto: CreateOrderDto) {
    return this.prisma.$transaction(
      async (tx) => {
        const stock = await tx.stock.findUnique({
          where: {
            symbol: dto.stockSymbol.trim().toUpperCase(),
          },
        });

        if (!stock) {
          throw new NotFoundException('Stock not found');
        }

        if (stock.status !== StockStatus.ACTIVE) {
          throw new BadRequestException('Stock is not active');
        }

        const quantity = new Prisma.Decimal(dto.quantity);

        if (quantity.lte(0)) {
          throw new BadRequestException('Quantity must be greater than zero');
        }

        let price: Prisma.Decimal | null = null;

        if (dto.type === OrderType.LIMIT) {
          if (!dto.price || dto.price <= 0) {
            throw new BadRequestException('Limit order price is required');
          }

          price = new Prisma.Decimal(dto.price);
        }

        let lockedAmount = new Prisma.Decimal(0);

        if (dto.side === OrderSide.BUY) {
          lockedAmount =
            dto.type === OrderType.LIMIT
              ? price!.mul(quantity)
              : await this.estimateMarketBuyCost(
                  tx,
                  stock.id,
                  quantity,
                  userId,
                );

          if (dto.type === OrderType.MARKET && lockedAmount.lte(0)) {
            throw new BadRequestException('No sell liquidity available');
          }

          const balance = await tx.balance.findUnique({
            where: { userId },
          });

          if (!balance) {
            throw new NotFoundException('Balance not found');
          }

          const availableLkr = new Prisma.Decimal(balance.availableLkr);

          if (availableLkr.lt(lockedAmount)) {
            throw new BadRequestException('Insufficient available LKR balance');
          }

          await tx.balance.update({
            where: { userId },
            data: {
              availableLkr: {
                decrement: lockedAmount,
              },
              lockedLkr: {
                increment: lockedAmount,
              },
            },
          });
        }

        if (dto.side === OrderSide.SELL) {
          const portfolio = await tx.portfolio.findUnique({
            where: {
              userId_stockId: {
                userId,
                stockId: stock.id,
              },
            },
          });

          if (!portfolio) {
            throw new BadRequestException('You do not own this stock');
          }

          const availableQuantity = new Prisma.Decimal(portfolio.quantity);

          if (availableQuantity.lt(quantity)) {
            throw new BadRequestException('Insufficient stock quantity');
          }

          await tx.portfolio.update({
            where: {
              userId_stockId: {
                userId,
                stockId: stock.id,
              },
            },
            data: {
              quantity: {
                decrement: quantity,
              },
              lockedQuantity: {
                increment: quantity,
              },
            },
          });
        }

        const needsApproval = dto.requiresApproval === true;

        const order = await tx.order.create({
          data: {
            userId,
            stockId: stock.id,
            side: dto.side,
            type: dto.type,
            price,
            quantity,
            remainingQty: quantity,
            lockedAmount,
            status: needsApproval ? PENDING_APPROVAL : OrderStatus.OPEN,
          },
          include: {
            stock: true,
            buyTrades: true,
            sellTrades: true,
          },
        });

        if (!needsApproval) {
          await this.matchingEngine.matchOrder(tx, order.id);
        }

        return tx.order.findUnique({
          where: { id: order.id },
          include: {
            stock: true,
            buyTrades: true,
            sellTrades: true,
          },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  }

  async adminFindAll() {
    return this.prisma.order.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
        stock: true,
        buyTrades: true,
        sellTrades: true,
      },
    });
  }

  async approveOrder(orderId: string) {
    return this.prisma.$transaction(
      async (tx) => {
        const order = await tx.order.findUnique({
          where: { id: orderId },
          include: {
            stock: true,
          },
        });

        if (!order) {
          throw new NotFoundException('Order not found');
        }

        if (order.status !== PENDING_APPROVAL) {
          throw new BadRequestException(
            'Only pending approval orders can be approved',
          );
        }

        await tx.order.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.OPEN,
          },
        });

        await this.matchingEngine.matchOrder(tx, order.id);

        return tx.order.findUnique({
          where: { id: order.id },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            stock: true,
            buyTrades: true,
            sellTrades: true,
          },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  }

  async rejectOrder(orderId: string) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          stock: true,
        },
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      if (order.status !== PENDING_APPROVAL) {
        throw new BadRequestException(
          'Only pending approval orders can be rejected',
        );
      }

      await this.releaseLockedResources(tx, order);

      return tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.REJECTED,
          remainingQty: new Prisma.Decimal(0),
          lockedAmount: new Prisma.Decimal(0),
        },
        include: {
          stock: true,
        },
      });
    });
  }

  async findMine(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        stock: true,
        buyTrades: true,
        sellTrades: true,
      },
    });
  }

  async findOne(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        stock: true,
        buyTrades: true,
        sellTrades: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.userId !== userId) {
      throw new ForbiddenException('You cannot view this order');
    }

    return order;
  }

  async cancel(userId: string, orderId: string) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          stock: true,
        },
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      if (order.userId !== userId) {
        throw new ForbiddenException('You cannot cancel this order');
      }

      if (
        order.status !== PENDING_APPROVAL &&
        order.status !== OrderStatus.OPEN &&
        order.status !== OrderStatus.PARTIALLY_FILLED
      ) {
        throw new BadRequestException(
          'Only pending or open orders can be cancelled',
        );
      }

      await this.releaseLockedResources(tx, order);

      return tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.CANCELLED,
          remainingQty: new Prisma.Decimal(0),
          lockedAmount: new Prisma.Decimal(0),
        },
        include: {
          stock: true,
        },
      });
    });
  }

  async getOrderBook(symbol: string) {
    const stock = await this.prisma.stock.findUnique({
      where: {
        symbol: symbol.trim().toUpperCase(),
      },
    });

    if (!stock) {
      throw new NotFoundException('Stock not found');
    }

    const buyOrders = await this.prisma.order.findMany({
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
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const sellOrders = await this.prisma.order.findMany({
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
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      symbol: stock.symbol,
      stockId: stock.id,
      buyOrders,
      sellOrders,
    };
  }

  private async releaseLockedResources(
    tx: Prisma.TransactionClient,
    order: {
      id: string;
      userId: string;
      stockId: string;
      side: OrderSide;
      remainingQty: Prisma.Decimal;
      lockedAmount: Prisma.Decimal;
    },
  ) {
    const remainingQty = new Prisma.Decimal(order.remainingQty);

    if (order.side === OrderSide.BUY) {
      const lockedAmount = new Prisma.Decimal(order.lockedAmount);

      if (lockedAmount.gt(0)) {
        await tx.balance.update({
          where: { userId: order.userId },
          data: {
            lockedLkr: {
              decrement: lockedAmount,
            },
            availableLkr: {
              increment: lockedAmount,
            },
          },
        });
      }
    }

    if (order.side === OrderSide.SELL && remainingQty.gt(0)) {
      await tx.portfolio.update({
        where: {
          userId_stockId: {
            userId: order.userId,
            stockId: order.stockId,
          },
        },
        data: {
          quantity: {
            increment: remainingQty,
          },
          lockedQuantity: {
            decrement: remainingQty,
          },
        },
      });
    }
  }

  private async estimateMarketBuyCost(
    tx: Prisma.TransactionClient,
    stockId: string,
    quantity: Prisma.Decimal,
    userId: string,
  ) {
    const sellOrders = await tx.order.findMany({
      where: {
        stockId,
        side: OrderSide.SELL,
        userId: {
          not: userId,
        },
        status: {
          in: [OrderStatus.OPEN, OrderStatus.PARTIALLY_FILLED],
        },
        price: {
          not: null,
        },
      },
      orderBy: [{ price: 'asc' }, { createdAt: 'asc' }],
    });

    let remaining = quantity;
    let estimatedCost = new Prisma.Decimal(0);

    for (const sellOrder of sellOrders) {
      if (remaining.lte(0)) {
        break;
      }

      if (!sellOrder.price) {
        continue;
      }

      const availableQty = new Prisma.Decimal(sellOrder.remainingQty);
      const fillQty = remaining.lessThan(availableQty)
        ? remaining
        : availableQty;

      estimatedCost = estimatedCost.plus(
        new Prisma.Decimal(sellOrder.price).mul(fillQty),
      );

      remaining = remaining.minus(fillQty);
    }

    return estimatedCost;
  }
}
