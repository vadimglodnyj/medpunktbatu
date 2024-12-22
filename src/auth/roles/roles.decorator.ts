import { SetMetadata } from '@nestjs/common';
import { RoleEnum } from '../../users/entities/user.entity';

export const Roles = (...roles: RoleEnum[]) => {
  console.log('Декоратор @Roles - Ролі:', roles); // Лог для перевірки
  return SetMetadata('roles', roles);
};
