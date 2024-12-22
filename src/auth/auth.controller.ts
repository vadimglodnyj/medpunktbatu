import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  Res,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { Response, Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('login')
  async login(
    @Body() loginDto: { username: string; password: string },
    @Res({ passthrough: true }) response: Response,
  ) {
    const user = await this.authService.validateUser(
      loginDto.username,
      loginDto.password,
    );
    if (!user) {
      throw new UnauthorizedException('Неправильні дані для входу.');
    }

    console.log('AuthController - Користувач для входу:', user);

    const { accessToken, refreshToken } = await this.authService.login(user);

    // Встановлюємо refreshToken в httpOnly cookie
    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true, // Увімкніть, якщо використовуєте HTTPS
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 днів
    });

    return { accessToken };
  }

  @Post('logout')
  async logout(
    @Body('userId') userId: number,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.authService.logout(userId);

    // Очищуємо кукі
    response.clearCookie('refreshToken', {
      httpOnly: true,
      secure: true, // Залиште це true, якщо використовуєте HTTPS
      sameSite: 'strict',
    });

    console.log(`AuthController - Logout для ID: ${userId}`);
  }

  @Post('refresh')
  async refresh(@Req() request: Request): Promise<{ accessToken: string }> {
    const refreshToken = request.cookies['refreshToken'];
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token відсутній.');
    }

    return this.authService.refresh(refreshToken);
  }
}
