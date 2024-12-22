import {
  Controller,
  Put,
  Param,
  ParseIntPipe,
  UseGuards,
  Body,
  Post,
  Get,
} from '@nestjs/common';
import { Roles } from '../auth/roles/roles.decorator';
import { RolesGuard } from '../auth/roles/roles.guard';
import { RoleEnum } from './entities/user.entity';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from 'src/auth/jwt.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async createUser(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.createUser(
      createUserDto.username,
      createUserDto.password,
      RoleEnum.Medic,
    );
  }

  
  @Put(':id/confirm')
  @Roles(RoleEnum.Admin)
  async confirmUser(@Param('id', ParseIntPipe) id: number): Promise<User> {
    return this.usersService.confirmUser(id);
  }

  @Get()
  @Roles(RoleEnum.Admin)
  async findAllUsers(): Promise<User[]> {
    return this.usersService.findAllUsers();
  }

  
}
