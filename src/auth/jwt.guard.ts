import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    console.log('JWT Guard - Користувач:', user); // Додано лог для перевірки користувача
    if (err || !user) {
      return null; // Якщо користувача немає, повертаємо null
    }
    return user; // Передаємо користувача в request.user
  }
}
