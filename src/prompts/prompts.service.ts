// src/prompts/prompts.service.ts

import { Injectable } from '@nestjs/common';
import { ChatOllama } from '@langchain/ollama';
import {
  ChatPromptTemplate,
  PromptTemplate,
  FewShotPromptTemplate,
} from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { config } from '../config';

@Injectable()
export class PromptsService {
  private llm = new ChatOllama({
    model: config.ollama.chatModel,
    baseUrl: config.ollama.baseUrl,
    temperature: config.ollama.temperature,
  });

  // ── ChatPromptTemplate：多消息对话模板（最常用）─────────
  // fromMessages 接收 [role, content] 数组
  // role 可以是 'system' | 'human' | 'ai'
  // content 里的 {变量名} 是占位符，invoke 时替换
  async translateText(text: string, targetLang: string) {
    const prompt = ChatPromptTemplate.fromMessages([
      ['system', '你是专业翻译，只输出翻译结果，不加任何解释。'],
      ['human', '请把以下内容翻译成{targetLang}：\n\n{text}'],
    ]);

    // pipe 把 prompt、llm、parser 串联
    // prompt.invoke({ text, targetLang }) → 格式化后的消息数组
    // llm.invoke(消息数组) → AIMessage
    // parser.invoke(AIMessage) → 纯字符串
    const chain = prompt.pipe(this.llm).pipe(new StringOutputParser());
    const result = await chain.invoke({ text, targetLang });

    return { original: text, targetLang, translated: result };
  }

  // ── PromptTemplate：单消息简单模板──────────────────────
  // 比 ChatPromptTemplate 简单，只有一条 human 消息
  async summarizeText(text: string, maxWords: number) {
    const prompt = PromptTemplate.fromTemplate(
      '用不超过{maxWords}个字总结以下内容，只输出总结：\n\n{text}',
    );
    const chain = prompt.pipe(this.llm).pipe(new StringOutputParser());
    const result = await chain.invoke({ text, maxWords });

    return { original: text, maxWords, summary: result };
  }

  // ── FewShotPromptTemplate：少样本学习模板───────────────
  // 给模型几个示例，让它学会输出格式
  // 适合需要严格控制输出格式的分类、提取任务
  async classifyText(text: string) {
    // 示例数组：展示正确的输入→输出映射
    const examples = [
      { input: '这个产品太棒了！', output: '正面' },
      { input: '完全不值这个价格', output: '负面' },
      { input: '还可以吧，普通', output: '中性' },
      { input: '强烈推荐！超出预期', output: '正面' },
      { input: '很失望，不会再买了', output: '负面' },
    ];

    // 每个示例的格式模板
    const examplePrompt = PromptTemplate.fromTemplate(
      '输入：{input}\n输出：{output}',
    );

    const fewShotPrompt = new FewShotPromptTemplate({
      examples,
      examplePrompt,
      prefix: '分析文本情感，只输出：正面、负面、中性之一。\n\n示例：',
      suffix: '输入：{input}\n输出：',
      inputVariables: ['input'],
    });

    const formattedPrompt = await fewShotPrompt.format({ input: text });
    const response = await this.llm.invoke(formattedPrompt);

    return { text, sentiment: JSON.stringify(response.content).trim() };
  }

  // ── 代码审查：复杂 System Prompt 示例──────────────────
  async codeReview(code: string, language: string) {
    const prompt = ChatPromptTemplate.fromMessages([
      [
        'system',
        `你是资深{language}开发工程师，负责代码审查。
审查维度：代码规范 / 潜在 Bug / 性能问题 / 改进建议
输出格式：总体评分（1-10分）+ 具体问题列表 + 改进代码片段`,
      ],
      [
        'human',
        `请审查以下{language}代码：
        \n\n
          \`\`\`{language}
          \n{code}\n
          \`\`\`
        `,
      ],
    ]);

    const chain = prompt.pipe(this.llm).pipe(new StringOutputParser());
    const result = await chain.invoke({ code, language });

    return { language, code, review: result };
  }
}
