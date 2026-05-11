import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CompanyStatus, StockStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStockDto } from './dto/create-stock.dto';
import { UpdateStockStatusDto } from './dto/update-stock-status.dto';

@Injectable()
export class StocksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(adminUserId: string, dto: CreateStockDto) {
    const symbol = dto.symbol.trim().toUpperCase();

    const company = await this.prisma.company.findUnique({
      where: { id: dto.companyId },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    if (company.status !== CompanyStatus.APPROVED) {
      throw new BadRequestException(
        'Company must be approved before listing stock',
      );
    }

    const existingStock = await this.prisma.stock.findUnique({
      where: { symbol },
    });

    if (existingStock) {
      throw new BadRequestException('Stock symbol already exists');
    }

    return this.prisma.$transaction(async (tx) => {
      const stock = await tx.stock.create({
        data: {
          companyId: dto.companyId,
          symbol,
          name: dto.name.trim(),
          totalShares: dto.totalShares.toString(),
          availableShares: dto.totalShares.toString(),
          lastPrice: (dto.initialPrice ?? 0).toString(),
          status: StockStatus.ACTIVE,
        },
        include: {
          company: true,
        },
      });

      await tx.portfolio.create({
        data: {
          userId: adminUserId,
          stockId: stock.id,
          quantity: dto.totalShares.toString(),
          lockedQuantity: '0',
          avgBuyPrice: (dto.initialPrice ?? 0).toString(),
        },
      });

      return stock;
    });
  }

  async findAll() {
    return this.prisma.stock.findMany({
      orderBy: { symbol: 'asc' },
      include: {
        company: true,
      },
    });
  }

  async findActive() {
    return this.prisma.stock.findMany({
      where: { status: StockStatus.ACTIVE },
      orderBy: { symbol: 'asc' },
      include: {
        company: true,
      },
    });
  }

  async findBySymbol(symbol: string) {
    const stock = await this.prisma.stock.findUnique({
      where: { symbol: symbol.trim().toUpperCase() },
      include: {
        company: true,
        orders: {
          where: {
            status: {
              in: ['OPEN', 'PARTIALLY_FILLED'],
            },
          },
          orderBy: [{ price: 'desc' }, { createdAt: 'asc' }],
        },
      },
    });

    if (!stock) {
      throw new NotFoundException('Stock not found');
    }

    return stock;
  }

  async updateStatus(id: string, dto: UpdateStockStatusDto) {
    await this.findById(id);

    return this.prisma.stock.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  async findById(id: string) {
    const stock = await this.prisma.stock.findUnique({
      where: { id },
      include: {
        company: true,
      },
    });

    if (!stock) {
      throw new NotFoundException('Stock not found');
    }

    return stock;
  }
}
