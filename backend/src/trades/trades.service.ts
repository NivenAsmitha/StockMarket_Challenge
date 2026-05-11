import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TradesService {
  constructor(private readonly prisma: PrismaService) {}

  async findMine(userId: string) {
    return this.prisma.trade.findMany({
      where: {
        OR: [{ buyerId: userId }, { sellerId: userId }],
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        stock: true,
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async recentBySymbol(symbol: string) {
    const stock = await this.prisma.stock.findUnique({
      where: {
        symbol: symbol.trim().toUpperCase(),
      },
    });

    if (!stock) {
      throw new NotFoundException('Stock not found');
    }

    return this.prisma.trade.findMany({
      where: {
        stockId: stock.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
      include: {
        stock: true,
      },
    });
  }
}
