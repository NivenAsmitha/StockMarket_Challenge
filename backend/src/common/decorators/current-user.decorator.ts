import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Request } from 'express';

export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  isEmailVerified: boolean;
  isActive: boolean;
};

type AuthenticatedRequest = Request & {
  user?: AuthenticatedUser;
};

export const CurrentUser = createParamDecorator(
  (
    _data: unknown,
    context: ExecutionContext,
  ): AuthenticatedUser | undefined => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user;
  },
);
