import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CompanyStatus, Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';

@ApiTags('Companies')
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCompanyDto,
  ) {
    return this.companiesService.create(user.id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('mine')
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.companiesService.findMine(user.id);
  }

  @ApiQuery({
    name: 'status',
    required: false,
    enum: CompanyStatus,
  })
  @Get()
  findAll(@Query('status') status?: CompanyStatus) {
    return this.companiesService.findAll(status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.companiesService.findOne(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id/approve')
  approve(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.companiesService.approve(id, user.role);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id/reject')
  reject(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.companiesService.reject(id, user.role);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id/suspend')
  suspend(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.companiesService.suspend(id, user.role);
  }
}
