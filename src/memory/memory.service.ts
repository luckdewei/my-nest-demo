import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import { ChatOllama } from '@langchain/ollama';
import {
  HumanMessage,
  AIMessage,
  SystemMessage,
  BaseMessage,
} from '@langchain/core/messages';
import { config } from '../config';

@Injectable()
export class MemoryService {
  private llm = new ChatOllama({
    model: config.ollama.chatModel,
    baseUrl: config.ollama.baseUrl,
    temperature: config.ollama.temperature,
  });

  // 会话存储：sessionId → 消息历史数组
  // NestJS Service 是单例，Map 在整个应用生命周期内存在
  private sessions = new Map<string, BaseMessage[]>();

  private systemMessage = new SystemMessage(
    '你是一个智能助手，能记住对话历史，根据上下文准确回答。',
  );

  private getOrCreate(sessionId: string): BaseMessage[] {
    if (!this.sessions.has(sessionId)) {
      // 新会话：初始化时加入 SystemMessage
      this.sessions.set(sessionId, [this.systemMessage]);
    }
    return this.sessions.get(sessionId)!;
  }

  // ── 多轮对话（REST 版本）──────────────────────────────
  async chat(sessionId: string, message: string) {
    const history = this.getOrCreate(sessionId);

    // 把用户新消息加入历史
    history.push(new HumanMessage(message));

    // 把完整历史发给模型（包含 System + 所有历史 + 本次消息）
    // 模型看到完整上下文，能理解之前说了什么
    const response = await this.llm.invoke(history);

    // 把模型回复也加入历史，下次对话继续携带
    history.push(response);

    return {
      sessionId,
      message,
      reply: response.content,
      turns: Math.floor((history.length - 1) / 2), // 对话轮次
    };
  }

  // ── 多轮对话（SSE 流式版本）──────────────────────────
  async chatStream(sessionId: string, message: string, res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const history = this.getOrCreate(sessionId);
    history.push(new HumanMessage(message));

    let fullReply = '';

    const stream = await this.llm.stream(history);
    for await (const chunk of stream) {
      if (chunk.content) {
        const text = chunk.content as string;
        fullReply += text;
        res.write(`data: ${JSON.stringify({ text, sessionId })}\n\n`);
      }
    }

    // 流结束后把完整回复存入历史
    history.push(new AIMessage(fullReply));
    res.write(
      `data: ${JSON.stringify({ text: '[DONE]', turns: Math.floor((history.length - 1) / 2) })}\n\n`,
    );
    res.end();
  }

  // ── 查看会话历史 ──────────────────────────────────────
  getHistory(sessionId: string) {
    const history = this.sessions.get(sessionId);
    if (!history) return { sessionId, exists: false, messages: [] };

    const messages = history
      .filter((m) => !(m instanceof SystemMessage))
      .map((m, i) => ({
        index: i + 1,
        role: m instanceof HumanMessage ? 'user' : 'assistant',
        content: m.content,
      }));

    return {
      sessionId,
      exists: true,
      turns: Math.floor(messages.length / 2),
      messages,
    };
  }

  // ── 清空会话 ──────────────────────────────────────────
  clearSession(sessionId: string) {
    if (!this.sessions.has(sessionId)) {
      return { sessionId, cleared: false, message: '会话不存在' };
    }
    this.sessions.set(sessionId, [this.systemMessage]);
    return { sessionId, cleared: true, message: '会话已清空' };
  }

  // ── 所有会话列表 ──────────────────────────────────────
  listSessions() {
    const sessions = Array.from(this.sessions.entries()).map(([id, h]) => ({
      sessionId: id,
      turns: Math.floor((h.length - 1) / 2),
    }));
    return { total: sessions.length, sessions };
  }
}
