import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
  Param,
  Put,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('hello')
  getHello() {
    return this.userService.getHello();
  }

  @Get('list')
  getList(@Query('page') page: string, @Query('size') size: string) {
    return this.userService.getList(Number(page), Number(size));
  }

  @Get('user/:id')
  getUserById(@Param('id') id: string) {
    return this.userService.getUserById(id);
  }

  @Post('create')
  create(@Body() dto: CreateUserDto) {
    return this.userService.createUser(dto);
  }

  @Put('user/:id')
  updateUser(@Param('id') id: string, @Body() dto: CreateUserDto) {
    return this.userService.updateUser(id, dto);
  }

  // DELETE /demo/user/123 → 路径参数（删除）
  @Delete('user/:id')
  deleteUser(@Param('id') id: string) {
    return this.userService.deleteUser(id);
  }
}
