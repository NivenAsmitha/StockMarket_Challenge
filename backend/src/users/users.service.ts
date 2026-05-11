import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isEmailVerified: true,
        isActive: true,
        createdAt: true,
        balance: {
          select: {
            totalLkr: true,
            availableLkr: true,
            lockedLkr: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isEmailVerified: true,
        isActive: true,
        createdAt: true,
        balance: {
          select: {
            totalLkr: true,
            availableLkr: true,
            lockedLkr: true,
          },
        },
        portfolios: {
          include: {
            stock: true,
          },
        },
        orders: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 20,
          include: {
            stock: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateStatus(
    targetUserId: string,
    dto: UpdateUserStatusDto,
    adminUserId: string,
  ) {
    if (targetUserId === adminUserId && dto.isActive === false) {
      throw new BadRequestException('You cannot deactivate your own account');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id: targetUserId },
      data: {
        isActive: dto.isActive,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isEmailVerified: true,
        isActive: true,
        createdAt: true,
      },
    });
  }
}
