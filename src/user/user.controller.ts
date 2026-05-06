// src/user/user.controller.ts

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // POST /user/create → 创建用户
  @Post('create')
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  // GET /user/list                           → 查询第 1 页，每页 10 条
  // GET /user/list?page=2&pageSize=5         → 查询第 2 页，每页 5 条
  // GET /user/list?name=大伟                  → 按名字模糊搜索
  // GET /user/list?role=admin                → 只查管理员
  // GET /user/list?page=1&pageSize=10&name=大伟&role=admin → 组合查询
  @Get('list')
  findAll(
    // @Query() 把 URL 中所有 query 参数解析成 QueryUserDto 对象
    // 例如 ?page=2&pageSize=5&name=大伟 → { page: '2', pageSize: '5', name: '大伟' }
    @Query() query: QueryUserDto,
  ) {
    return this.userService.findAll(query);
  }

  // GET /user/1 → 查询单个用户（含文章列表）
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findOne(id);
  }

  // PUT /user/1 → 更新用户
  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto) {
    return this.userService.update(id, dto);
  }

  // DELETE /user/1 → 删除用户
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.userService.remove(id);
  }
}
