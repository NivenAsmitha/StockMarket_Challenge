import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DepositBalanceDto } from './dto/deposit-balance.dto';

@Injectable()
export class BalancesService {
  constructor(private readonly prisma: PrismaService) {}

  async findMe(userId: string) {
    const balance = await this.prisma.balance.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!balance) {
      throw new NotFoundException('Balance not found');
    }

    return balance;
  }

  async deposit(userId: string, dto: DepositBalanceDto) {
    if (dto.amount <= 0) {
      throw new BadRequestException('Deposit amount must be greater than zero');
    }

    return this.prisma.$transaction(async (tx) => {
      const balance = await tx.balance.findUnique({
        where: { userId },
      });

      if (!balance) {
        throw new NotFoundException('Balance not found');
      }

      return tx.balance.update({
        where: { userId },
        data: {
          totalLkr: {
            increment: dto.amount,
          },
          availableLkr: {
            increment: dto.amount,
          },
        },
      });
    });
  }
}
