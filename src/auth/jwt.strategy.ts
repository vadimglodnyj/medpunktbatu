import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'yourSecretKey',
    });
    console.log('JwtStrategy - Стратегія ініціалізована');
  }
  async validate(payload: any) {
    console.log('JWT Strategy - Payload:', payload);
    if (!payload) {
      throw new UnauthorizedException('Токен недійсний.');
    }
    return { username: payload.username, role: payload.role }; // Додаємо користувача до request.user
  }
}
