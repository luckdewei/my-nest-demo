// src/user/user.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { Prisma } from '../generated/prisma/client';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── 创建用户 ──────────────────────────────────────────
  async create(dto: CreateUserDto) {
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: dto.password,
        role: dto.role ?? 'user',
      },
    });
    return { success: true, data: user };
  }

  // ─── 分页查询用户列表（支持搜索过滤）─────────────────
  async findAll(query: QueryUserDto) {
    // URL 传来的参数都是字符串，这里转成数字并设默认值
    // page 不传则默认第 1 页
    const page = Number(query.page) || 1;
    // pageSize 不传则默认每页 10 条，最大限制 100 防止一次查太多
    const pageSize = Math.min(Number(query.pageSize) || 10, 100);

    // skip：跳过前面多少条记录（分页偏移量）
    // 第 1 页：skip = (1-1) × 10 = 0，从第 1 条开始取
    // 第 2 页：skip = (2-1) × 10 = 10，从第 11 条开始取
    // 第 3 页：skip = (3-1) × 10 = 20，从第 21 条开始取
    const skip = (page - 1) * pageSize;

    // 构建动态过滤条件
    // 使用 Prisma 的 where 对象，只有传了对应参数才加过滤条件
    const where: Prisma.UserWhereInput = {};

    // name 搜索：模糊匹配，contains 相当于 SQL 的 LIKE '%xxx%'
    // mode: 'insensitive' 表示忽略大小写（PostgreSQL 专用配置）
    if (query.name) {
      where.name = {
        contains: query.name,
        mode: 'insensitive',
      };
    }

    // role 过滤：精确匹配
    if (query.role) {
      where.role = query.role;
    }

    // 使用 prisma.$transaction 同时执行两个查询，保证在同一事务内
    // 好处：total 和 list 基于同一时刻的数据，不会因为并发写入导致数据不一致
    const [total, list] = await this.prisma.$transaction([
      // 第一个查询：统计满足条件的总记录数（用于前端计算总页数）
      // count 不受 skip/take 影响，统计的是全部满足 where 条件的数量
      this.prisma.user.count({ where }),

      // 第二个查询：查询当前页的数据列表
      this.prisma.user.findMany({
        where, // 过滤条件（同上）
        skip, // 跳过前面的记录
        take: pageSize, // 取当前页的数据条数
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          // password 字段不返回，保证安全
        },
        // 按创建时间降序排列，最新注册的用户在前面
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // 计算总页数：向上取整
    // 例如 total=25，pageSize=10，则 totalPages = Math.ceil(25/10) = 3
    const totalPages = Math.ceil(total / pageSize);

    return {
      // 分页元信息：前端需要这些数据来渲染分页组件
      pagination: {
        page, // 当前页码
        pageSize, // 每页条数
        total, // 总记录数
        totalPages, // 总页数
        hasNext: page < totalPages, // 是否有下一页
        hasPrev: page > 1, // 是否有上一页
      },
      // 当前页的数据列表
      list,
    };
  }

  // ─── 查询单个用户（含文章列表）────────────────────────
  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        // 联表查询该用户的所有文章
        posts: {
          select: {
            id: true,
            title: true,
            published: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      return { success: false, message: `用户 ID ${id} 不存在` };
    }
    return { success: true, data: user };
  }

  // ─── 更新用户 ───────────────────────────────────────────
  async update(id: number, dto: UpdateUserDto) {
    const exists = await this.prisma.user.findUnique({ where: { id } });
    if (!exists) {
      return { success: false, message: `用户 ID ${id} 不存在` };
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true,
      },
    });
    return { success: true, message: '更新成功', data: updated };
  }

  // ─── 删除用户 ───────────────────────────────────────────
  async remove(id: number) {
    const exists = await this.prisma.user.findUnique({ where: { id } });
    if (!exists) {
      return { success: false, message: `用户 ID ${id} 不存在` };
    }

    // onDelete: Cascade 配置使删除用户时自动级联删除其文章
    await this.prisma.user.delete({ where: { id } });
    return { success: true, message: `用户 ID ${id} 已删除` };
  }
}
