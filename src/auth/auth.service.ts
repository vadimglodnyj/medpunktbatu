import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.usersService.findByUsername(username);
    if (user && (await bcrypt.compare(password, user.password))) {
      if (!user.isConfirmed) {
        throw new UnauthorizedException('Користувач не підтверджений.');
      }
      const { password, ...result } = user;
      return result; // Повертає користувача без пароля
    }
    return null;
  }

  async login(
    user: any,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { username: user.username, role: user.role };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    await this.usersService.updateRefreshToken(user.id, refreshToken); // Передаємо необроблений токен

    return { accessToken, refreshToken };
  }

  async logout(userId: number): Promise<void> {
    console.log(`AuthService - Logout для користувача ID: ${userId}`);
    await this.usersService.updateRefreshToken(userId, null);
    console.log(`AuthService - RefreshToken очищено для ID: ${userId}`);
  }
  async refresh(refreshToken: string): Promise<{ accessToken: string }> {
    const user = await this.usersService.findUserByRefreshToken(refreshToken);
    if (!user) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const payload = { username: user.username, role: user.role };
    const newAccessToken = this.jwtService.sign(payload, { expiresIn: '15m' });

    return { accessToken: newAccessToken };
  }
}
