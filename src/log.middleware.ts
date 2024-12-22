import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LogMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    console.log('Middleware - Заголовки:', req.headers); // Лог заголовків
    console.log('Middleware - Authorization:', req.headers.authorization); // Лог Authorization
    next(); // Передаємо запит далі
  }
}
