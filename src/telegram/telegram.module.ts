import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { TelegramController } from './telegram.controller';

@Module({
  providers: [TelegramService], // TelegramService оголошено тут
  controllers: [TelegramController],
  exports: [TelegramService], // TelegramService експортовано для використання в інших модулях
})
export class TelegramModule {}
