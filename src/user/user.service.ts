import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
  private users = [
    { id: '1', name: '大伟老师', age: 30, email: 'dawei@example.com' },
    { id: '2', name: '小明', age: 25, email: 'xiaoming@example.com' },
  ];

  getHello() {
    return {
      message: 'hello',
      timestamp: new Date().toISOString(),
    };
  }
  getList(page: number, size: number) {
    const currentPage = page || 1;
    const pageSize = size || 10;
    return {
      page: currentPage,
      size: pageSize,
      total: this.users.length,
      list: this.users,
    };
  }
  getUserById(id: string) {
    // 从数组里找对应 id 的用户
    const user = this.users.find((u) => u.id === id);
    if (!user) {
      // 没找到就返回提示信息
      return { success: false, message: `用户 ${id} 不存在` };
    }
    return { success: true, data: user };
  }

  createUser(dto: CreateUserDto) {
    const newUser = {
      id: String(Date.now()),
      name: dto.name,
      age: dto.age,
      email: dto.email ?? '未填写',
    };
    // 加入数组（模拟写入数据库）
    this.users.push(newUser);
    return { success: true, message: '创建成功', data: newUser };
  }

  updateUser(id: string, dto: CreateUserDto) {
    const index = this.users.findIndex((u) => u.id === id);
    if (index === -1) {
      return { success: false, message: `用户 ${id} 不存在` };
    }
    // 更新数据
    this.users[index] = { ...this.users[index], ...dto };
    return { success: true, message: '更新成功', data: this.users[index] };
  }

  deleteUser(id: string) {
    const index = this.users.findIndex((u) => u.id === id);
    if (index === -1) {
      return { success: false, message: `用户 ${id} 不存在` };
    }
    // 从数组中删除
    this.users.splice(index, 1);
    return { success: true, message: `用户 ${id} 已删除` };
  }
}
