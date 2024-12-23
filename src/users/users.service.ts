import {
  Injectable,
  OnModuleInit,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, RoleEnum } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService, // Додаємо ConfigService
  ) {}

  /**
   * Створює нового користувача.
   * @param username Логін користувача.
   * @param password Пароль користувача.
   * @param role Роль користувача.
   * @param isConfirmed Чи підтверджений користувач (за замовчуванням false).
   * @returns Створений користувач.
   */
  async createUser(
    username: string,
    password: string,
    role: RoleEnum = RoleEnum.Medic, // Роль за замовчуванням
    isConfirmed: boolean = false, // За замовчуванням не підтверджений
  ): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: { username },
    });
    if (existingUser) {
      throw new BadRequestException(
        `Користувач із іменем ${username} вже існує.`,
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = this.userRepository.create({
      username,
      password: hashedPassword,
      role, // Використовуємо роль за замовчуванням
      isConfirmed, // Встановлюємо значення isConfirmed
    });
    return this.userRepository.save(newUser);
  }

  /**
   * Підтверджує користувача за його ID.
   * @param id ID користувача.
   * @returns Підтверджений користувач.
   */
  async confirmUser(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Користувача з ID ${id} не знайдено.`);
    }
    user.isConfirmed = true;
    return this.userRepository.save(user);
  }

  /**
   * Знаходить користувача за логіном.
   * @param username Логін користувача.
   * @returns Користувач або null.
   */
  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { username } });
  }

  /**
   * Отримує всіх користувачів.
   * @returns Список користувачів.
   */
  async findAllUsers(): Promise<User[]> {
    return this.userRepository.find(); // Повертає всіх користувачів
  }

  /**
   * Оновлює refreshToken для користувача.
   * @param userId ID користувача.
   * @param refreshToken Новий refreshToken або null.
   */
  async updateRefreshToken(
    userId: number,
    refreshToken: string | null,
  ): Promise<void> {
    console.log('UsersService - Оновлення refreshToken для ID:', userId);

    const hashedRefreshToken = refreshToken
      ? await bcrypt.hash(refreshToken, 10)
      : null;
    await this.userRepository.update(userId, {
      refreshToken: hashedRefreshToken,
    });
  }

  /**
   * Знаходить користувача за refreshToken.
   * @param refreshToken RefreshToken користувача.
   * @returns Користувач або null.
   */
  async findUserByRefreshToken(refreshToken: string): Promise<User | null> {
    console.log('UsersService - Отримано refreshToken:', refreshToken);

    const users = await this.userRepository.find(); // Завантажуємо всіх користувачів

    for (const user of users) {
      if (
        user.refreshToken &&
        (await bcrypt.compare(refreshToken, user.refreshToken))
      ) {
        console.log(`UsersService - Користувач знайдений: ${user.username}`);
        return user;
      }
    }

    console.log('UsersService - Користувач з таким refreshToken не знайдений.');
    return null;
  }

  /**
   * Метод, що виконується при ініціалізації модуля.
   * Створює дефолтного адміністратора з isConfirmed = true, якщо його ще немає.
   */
  async onModuleInit() {
    const adminUsername = this.configService.get<string>('ADMIN_USERNAME') || 'admin';
    const adminPassword = this.configService.get<string>('ADMIN_PASSWORD') || 'password';

    const admin = await this.findByUsername(adminUsername);
    if (!admin) {
      console.log('Creating default admin user...');
      await this.createUser(
        adminUsername,
        adminPassword,
        RoleEnum.Admin,
        true, // Встановлюємо isConfirmed = true
      );
      console.log('Default admin user created.');
    } else {
      console.log('Admin user already exists.');
    }
  }
}
