// src/models/models.controller.ts

import { Controller, Post, Body, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ModelsService } from './models.service';

@Controller('models')
export class ModelsController {
  constructor(private readonly modelsService: ModelsService) {}

  @Post('chat')
  basicChat(@Body() body: { message: string }) {
    return this.modelsService.basicChat(body.message);
  }

  @Post('chat-system')
  chatWithSystem(@Body() body: { system: string; message: string }) {
    return this.modelsService.chatWithSystem(body.system, body.message);
  }

  @Post('chat-stream')
  streamChat(@Body() body: { message: string }, @Res() res: Response) {
    return this.modelsService.streamChat(body.message, res);
  }

  @Post('chat-parser')
  chatWithParser(@Body() body: { message: string }) {
    return this.modelsService.chatWithParser(body.message);
  }
}
