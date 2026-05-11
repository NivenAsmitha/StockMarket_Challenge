import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CompanyStatus, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateCompanyDto) {
    const symbol = dto.symbol.trim().toUpperCase();

    const existingCompany = await this.prisma.company.findUnique({
      where: { symbol },
    });

    if (existingCompany) {
      throw new BadRequestException('Company symbol already exists');
    }

    return this.prisma.company.create({
      data: {
        ownerId: userId,
        name: dto.name.trim(),
        symbol,
        description: dto.description?.trim(),
        status: CompanyStatus.PENDING,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        stocks: true,
      },
    });
  }

  async findAll(status?: CompanyStatus) {
    return this.prisma.company.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        stocks: true,
      },
    });
  }

  async findOne(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        stocks: true,
      },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return company;
  }

  async findMine(userId: string) {
    return this.prisma.company.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        stocks: true,
      },
    });
  }

  async approve(id: string, adminRole: Role) {
    this.ensureAdmin(adminRole);

    await this.findOne(id);

    return this.prisma.company.update({
      where: { id },
      data: { status: CompanyStatus.APPROVED },
    });
  }

  async reject(id: string, adminRole: Role) {
    this.ensureAdmin(adminRole);

    await this.findOne(id);

    return this.prisma.company.update({
      where: { id },
      data: { status: CompanyStatus.REJECTED },
    });
  }

  async suspend(id: string, adminRole: Role) {
    this.ensureAdmin(adminRole);

    await this.findOne(id);

    return this.prisma.company.update({
      where: { id },
      data: { status: CompanyStatus.SUSPENDED },
    });
  }

  private ensureAdmin(role: Role) {
    if (role !== Role.ADMIN) {
      throw new BadRequestException('Admin access required');
    }
  }
}
