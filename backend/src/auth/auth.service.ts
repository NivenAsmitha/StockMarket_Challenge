import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase();

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    const passwordHash = await argon2.hash(dto.password);
    const emailVerifyToken = randomBytes(32).toString('hex');
    const emailVerifyExpiry = new Date(Date.now() + 1000 * 60 * 60 * 24);

    const initialBalance =
      this.config.get<string>('INITIAL_USER_BALANCE') ?? '1000000';

    const user = await this.prisma.user.create({
      data: {
        email,
        name: dto.name,
        passwordHash,
        emailVerifyToken,
        emailVerifyExpiry,
        balance: {
          create: {
            totalLkr: initialBalance,
            availableLkr: initialBalance,
            lockedLkr: '0',
          },
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isEmailVerified: true,
      },
    });

    await this.mail.sendVerificationEmail(user.email, emailVerifyToken);

    return {
      message: 'Account created. Please verify your email before login.',
      user,
    };
  }

  async login(dto: LoginDto) {
    const email = dto.email.toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordOk = await argon2.verify(user.passwordHash, dto.password);

    if (!passwordOk) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is suspended');
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Please verify your email first');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        refreshTokenHash: await argon2.hash(tokens.refreshToken),
      },
    });

    return {
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async verifyEmail(token: string) {
    if (!token) {
      throw new BadRequestException('Verification token is required');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        emailVerifyToken: token,
        emailVerifyExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerifyToken: null,
        emailVerifyExpiry: null,
      },
    });

    return {
      message: 'Email verified successfully. You can now login.',
    };
  }

  async resendVerification(dto: ResendVerificationDto) {
    const email = dto.email.toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    const emailVerifyToken = randomBytes(32).toString('hex');
    const emailVerifyExpiry = new Date(Date.now() + 1000 * 60 * 60 * 24);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifyToken,
        emailVerifyExpiry,
      },
    });

    await this.mail.sendVerificationEmail(user.email, emailVerifyToken);

    return {
      message: 'Verification email sent again',
    };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isEmailVerified: true,
        isActive: true,
        balance: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  private async generateTokens(userId: string, email: string, role: Role) {
    const payload = {
      sub: userId,
      email,
      role,
    };

    const accessExpiresIn = (this.config.get<string>(
      'ACCESS_TOKEN_EXPIRES_IN',
    ) ?? '15m') as JwtSignOptions['expiresIn'];

    const refreshExpiresIn = (this.config.get<string>(
      'REFRESH_TOKEN_EXPIRES_IN',
    ) ?? '7d') as JwtSignOptions['expiresIn'];

    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: accessExpiresIn,
    });

    const refreshToken = await this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: refreshExpiresIn,
    });

    return {
      accessToken,
      refreshToken,
    };
  }
}
