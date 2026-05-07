// src/post/post.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── 创建文章 ──────────────────────────────────────────
  async create(dto: CreatePostDto) {
    const author = await this.prisma.user.findUnique({
      where: { id: dto.authorId },
    });
    if (!author) {
      return { success: false, message: `用户 ID ${dto.authorId} 不存在` };
    }

    const post = await this.prisma.post.create({
      data: {
        title: dto.title,
        content: dto.content,
        published: dto.published ?? false,
        author: { connect: { id: dto.authorId } },
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
      },
    });
    return { success: true, data: post };
  }

  // ─── 查询所有文章（含作者信息）────────────────────────
  async findAll(published?: boolean) {
    const posts = await this.prisma.post.findMany({
      where: published !== undefined ? { published } : {},
      include: {
        author: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { total: posts.length, list: posts };
  }

  // ─── 查询单篇文章 ───────────────────────────────────────
  async findOne(id: number) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, email: true, role: true } },
      },
    });
    if (!post) {
      return { success: false, message: `文章 ID ${id} 不存在` };
    }
    return { success: true, data: post };
  }

  // ─── 更新文章 ───────────────────────────────────────────
  async update(id: number, dto: UpdatePostDto) {
    const exists = await this.prisma.post.findUnique({ where: { id } });
    if (!exists) {
      return { success: false, message: `文章 ID ${id} 不存在` };
    }

    const updated = await this.prisma.post.update({
      where: { id },
      data: dto,
      include: { author: { select: { id: true, name: true } } },
    });
    return { success: true, message: '更新成功', data: updated };
  }

  // ─── 切换发布状态 ───────────────────────────────────────
  async togglePublish(id: number) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) {
      return { success: false, message: `文章 ID ${id} 不存在` };
    }

    const updated = await this.prisma.post.update({
      where: { id },
      data: { published: !post.published },
    });
    return {
      success: true,
      message: updated.published ? '文章已发布' : '文章已取消发布',
      data: updated,
    };
  }

  // ─── 删除文章 ───────────────────────────────────────────
  async remove(id: number) {
    const exists = await this.prisma.post.findUnique({ where: { id } });
    if (!exists) {
      return { success: false, message: `文章 ID ${id} 不存在` };
    }

    await this.prisma.post.delete({ where: { id } });
    return { success: true, message: `文章 ID ${id} 已删除` };
  }

  // ─── 查询某用户的所有文章 ───────────────────────────────
  async findByAuthor(authorId: number) {
    const posts = await this.prisma.post.findMany({
      where: { authorId },
      orderBy: { createdAt: 'desc' },
    });
    return { total: posts.length, list: posts };
  }
}
