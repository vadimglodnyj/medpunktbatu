import { Controller, Post, Body } from '@nestjs/common';
import { TelegramService } from './telegram.service';

@Controller('telegram')
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  @Post('send')
  async sendMessage(@Body('message') message: string): Promise<string> {
    await this.telegramService.sendMessage(message);
    return 'Повідомлення відправлено!';
  }
}
