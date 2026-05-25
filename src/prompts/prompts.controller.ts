// src/prompts/prompts.controller.ts

import { Controller, Post, Body } from '@nestjs/common';
import { PromptsService } from './prompts.service';

@Controller('prompts')
export class PromptsController {
  constructor(private readonly promptsService: PromptsService) {}

  @Post('translate')
  translate(@Body() body: { text: string; targetLang: string }) {
    return this.promptsService.translateText(body.text, body.targetLang);
  }

  @Post('summarize')
  summarize(@Body() body: { text: string; maxWords: number }) {
    return this.promptsService.summarizeText(body.text, body.maxWords);
  }

  @Post('classify')
  classify(@Body() body: { text: string }) {
    return this.promptsService.classifyText(body.text);
  }

  @Post('code-review')
  codeReview(@Body() body: { code: string; language: string }) {
    return this.promptsService.codeReview(body.code, body.language);
  }
}
