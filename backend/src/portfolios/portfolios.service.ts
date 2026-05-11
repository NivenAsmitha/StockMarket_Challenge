import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PortfoliosService {
  constructor(private readonly prisma: PrismaService) {}

  async findMine(userId: string) {
    return this.prisma.portfolio.findMany({
      where: {
        userId,
        OR: [
          {
            quantity: {
              gt: new Prisma.Decimal(0),
            },
          },
          {
            lockedQuantity: {
              gt: new Prisma.Decimal(0),
            },
          },
        ],
      },
      orderBy: {
        updatedAt: 'desc',
      },
      include: {
        stock: {
          include: {
            company: true,
          },
        },
      },
    });
  }

  async summary(userId: string) {
    const portfolios = await this.findMine(userId);

    const totalValue = portfolios.reduce((sum, item) => {
      const quantity = new Prisma.Decimal(item.quantity);
      const lastPrice = new Prisma.Decimal(item.stock.lastPrice);

      return sum.plus(quantity.mul(lastPrice));
    }, new Prisma.Decimal(0));

    return {
      totalStocks: portfolios.length,
      totalValue,
      portfolios,
    };
  }

  async findBySymbol(userId: string, symbol: string) {
    const portfolio = await this.prisma.portfolio.findFirst({
      where: {
        userId,
        stock: {
          symbol: symbol.trim().toUpperCase(),
        },
        OR: [
          {
            quantity: {
              gt: new Prisma.Decimal(0),
            },
          },
          {
            lockedQuantity: {
              gt: new Prisma.Decimal(0),
            },
          },
        ],
      },
      include: {
        stock: {
          include: {
            company: true,
          },
        },
      },
    });

    if (!portfolio) {
      throw new NotFoundException('Portfolio item not found');
    }

    return portfolio;
  }

  // Backward-compatible names for your existing controller/code
  async findMe(userId: string) {
    return this.findMine(userId);
  }

  async getPortfolioSummary(userId: string) {
    return this.summary(userId);
  }
}
