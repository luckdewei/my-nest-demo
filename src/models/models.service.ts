import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import { ChatOllama } from '@langchain/ollama';
import { config } from '../config';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { StringOutputParser } from '@langchain/core/output_parsers';
@Injectable()
export class ModelsService {
  private llm = new ChatOllama({
    model: config.ollama.chatModel,
    baseUrl: config.ollama.baseUrl,
    temperature: config.ollama.temperature,
  });

  // ── 方式一：基础调用（等待完整回答）────────────────────
  // invoke 发送消息数组，等模型生成完整回答后一次性返回
  // 适合：普通问答，不需要流式效果
  async basicChat(message: string) {
    const response = await this.llm.invoke([new HumanMessage(message)]);
    // response 是 AIMessage 对象
    // response.content → 模型回答的文字
    // response.usage_metadata → token 消耗统计
    return {
      question: message,
      answer: response.content,
      usage: response.usage_metadata,
    };
  }

  // ── 方式二：带 System Prompt ────────────────────────────
  // SystemMessage 设定模型角色，必须放在消息数组第一位
  async chatWithSystem(system: string, message: string) {
    const response = await this.llm.invoke([
      new SystemMessage(system), // 角色设定
      new HumanMessage(message), // 用户问题
    ]);
    return {
      system,
      question: message,
      answer: response.content,
    };
  }

  // ── 方式三：SSE 流式输出 ────────────────────────────────
  // stream 返回 AsyncGenerator，每次 yield 一个文字片段（chunk）
  // 适合：需要逐字显示的场景（像 ChatGPT 那样打字效果）
  async streamChat(message: string, res: Response) {
    // 设置 SSE 响应头，告诉浏览器这是事件流
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const stream = await this.llm.stream([new HumanMessage(message)]);

    // 逐个 chunk 推送给客户端
    // SSE 格式固定：data: JSON字符串\n\n
    for await (const chunk of stream) {
      if (chunk.content) {
        res.write(`data: ${JSON.stringify({ text: chunk.content })}\n\n`);
      }
    }

    // 发送结束标记，前端据此判断流结束
    res.write('data: [DONE]\n\n');
    res.end();
  }

  // ── 方式四：pipe 链（StringOutputParser）───────────────
  // pipe 把多个组件串联成链，输出类型从 AIMessage 变成 string
  async chatWithParser(message: string) {
    // prompt → llm → parser 三步流水线
    // StringOutputParser 把 AIMessage.content 提取成纯字符串
    const chain = this.llm.pipe(new StringOutputParser());
    const answer = await chain.invoke([new HumanMessage(message)]);
    // answer 直接是字符串，不是 AIMessage 对象
    return { question: message, answer };
  }
}
