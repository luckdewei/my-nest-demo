// src/post/post.controller.ts

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post('create')
  create(@Body() dto: CreatePostDto) {
    return this.postService.create(dto);
  }

  // GET /post/list?published=true|false
  @Get('list')
  findAll(@Query('published') published?: string) {
    const filter =
      published === 'true' ? true : published === 'false' ? false : undefined;
    return this.postService.findAll(filter);
  }

  // 注意：author/:authorId 路由必须放在 :id 前面，否则路由匹配会出错
  @Get('author/:authorId')
  findByAuthor(@Param('authorId', ParseIntPipe) authorId: number) {
    return this.postService.findByAuthor(authorId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.postService.findOne(id);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePostDto) {
    return this.postService.update(id, dto);
  }

  @Patch(':id/publish')
  togglePublish(@Param('id', ParseIntPipe) id: number) {
    return this.postService.togglePublish(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.postService.remove(id);
  }
}
