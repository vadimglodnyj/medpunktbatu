import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, RoleEnum } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createUser(
    username: string,
    password: string,
    role: RoleEnum = RoleEnum.Medic, // Роль за замовчуванням
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
      isConfirmed: false, // Новий користувач не підтверджений
    });
    return this.userRepository.save(newUser);
  }

  async confirmUser(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Користувача з ID ${id} не знайдено.`);
    }
    user.isConfirmed = true;
    return this.userRepository.save(user);
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { username } });
  }

  async findAllUsers(): Promise<User[]> {
    return this.userRepository.find(); // Повертає всіх користувачів
  }

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
}
