import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class TelegramService {
  private readonly apiUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;
  private readonly chatId = process.env.TELEGRAM_CHAT_ID;

  async sendMessage(
    message: string, // основний текст повідомлення
    parseMode?: string, // необов’язковий аргумент для parse_mode
  ): Promise<void> {
    console.log('TELEGRAM_BOT_TOKEN:', process.env.TELEGRAM_BOT_TOKEN);
    console.log('TELEGRAM_CHAT_ID:', process.env.TELEGRAM_CHAT_ID);
    if (!this.apiUrl || !this.chatId) {
      throw new Error('TELEGRAM_BOT_TOKEN або TELEGRAM_CHAT_ID не задані.');
    }

    const url = `${this.apiUrl}/sendMessage`;
    try {
      const response = await axios.post(url, {
        chat_id: this.chatId,
        text: message,
        parse_mode: parseMode, // <-- додаємо parse_mode
      });
      console.log('Відповідь Telegram API:', response.data);
    } catch (error: any) {
      console.error(
        'Помилка під час відправки повідомлення:',
        error.response?.data || error.message,
      );
      throw new Error('Помилка відправки повідомлення до Telegram.');
    }
  }

  async testTelegramMessage(): Promise<void> {
    try {
      await this.sendMessage('Тестове повідомлення');
    } catch (error: any) {
      // Логування помилки під час тестового повідомлення
      console.error('Тестове повідомлення не надіслано:', error.message);
      throw error; // Прокидаємо помилку далі для обробки
    }
  }
}
