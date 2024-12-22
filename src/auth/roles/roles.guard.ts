import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleEnum } from '../../users/entities/user.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<RoleEnum[]>(
      'roles',
      context.getHandler(),
    );
    const request = context.switchToHttp().getRequest();
    console.log('RolesGuard - Потрібні ролі:', requiredRoles);
    console.log('RolesGuard - Поточний користувач:', request.user); // Лог користувача

    if (!requiredRoles) {
      return true;
    }

    if (!request.user || !requiredRoles.includes(request.user.role)) {
      throw new ForbiddenException('У вас немає доступу до цього ресурсу.');
    }

    return true;
  }
}
