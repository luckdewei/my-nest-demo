// src/rag/rag.service.ts
// 方案一：MemoryVectorStore（内存向量库）

import { Injectable } from '@nestjs/common';
import { ChatOllama, OllamaEmbeddings } from '@langchain/ollama';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { Document } from '@langchain/core/documents';
// ⚠️ 注意：必须从 @langchain/classic 导入，不是 langchain/vectorstores/memory
import { MemoryVectorStore } from '@langchain/classic/vectorstores/memory';
import { config } from '../config';

@Injectable()
export class RagService {
  private llm = new ChatOllama({
    model: config.ollama.chatModel,
    baseUrl: config.ollama.baseUrl,
    temperature: 0.1,
    think: false,
    numPredict: 1024,
  });

  private embeddings = new OllamaEmbeddings({
    model: config.ollama.embedModel, // mxbai-embed-large
    baseUrl: config.ollama.baseUrl,
  });

  // 内存向量库实例（null = 未初始化）
  private vectorStore: MemoryVectorStore | null = null;
  private docCount = 0;

  // ── 加载文档 ───────────────────────────────────────────
  async loadDocuments(
    documents: { id: string; content: string; source?: string }[],
  ) {
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 50,
      separators: ['\n\n', '\n', '。', '！', '？', ' ', ''],
    });

    const allDocs: Document[] = [];
    for (const doc of documents) {
      const chunks = await splitter.createDocuments(
        [doc.content],
        [{ source: doc.source || doc.id, docId: doc.id }],
      );
      allDocs.push(...chunks);
    }

    // fromDocuments：批量向量化并存入内存
    this.vectorStore = await MemoryVectorStore.fromDocuments(
      allDocs,
      this.embeddings,
    );
    this.docCount = documents.length;

    return {
      success: true,
      originalDocs: documents.length,
      totalChunks: allDocs.length,
      message: `加载 ${documents.length} 篇文档，共 ${allDocs.length} 个块（内存存储）`,
    };
  }

  // ── 纯向量检索 ─────────────────────────────────────────
  async search(query: string, topK = 3) {
    if (!this.vectorStore) return { error: '请先调用 /rag/load 加载文档' };

    const results = await this.vectorStore.similaritySearchWithScore(
      query,
      topK,
    );
    return {
      query,
      results: results.map(([doc, score]) => ({
        content: doc.pageContent,
        source: doc.metadata.source as string,
        score: parseFloat(score.toFixed(4)),
      })),
    };
  }

  // ── 完整 RAG 问答 ──────────────────────────────────────
  async query(question: string, topK = 3) {
    if (!this.vectorStore) return { error: '请先调用 /rag/load 加载文档' };

    const retrieved = await this.vectorStore.similaritySearchWithScore(
      question,
      topK,
    );
    if (!retrieved.length)
      return { question, answer: '知识库中没有找到相关内容', sources: [] };

    const context = retrieved
      .map(([doc], i) => `[${i + 1}] ${doc.pageContent}`)
      .join('\n\n');

    const prompt = ChatPromptTemplate.fromMessages([
      [
        'system',
        `你是知识库问答助手，严格基于参考资料回答。
规则：
1. 只根据参考资料内容回答，不能使用资料外的知识
2. 资料中没有相关信息，回答"知识库中暂无相关内容"
3. 回答简洁准确，使用中文

参考资料：
{context}`,
      ],
      ['human', '{question}'],
    ]);

    const chain = prompt.pipe(this.llm).pipe(new StringOutputParser());
    const answer = await chain.invoke({ context, question });

    return {
      question,
      answer,
      sources: retrieved.map(([doc, score]) => ({
        content: doc.pageContent,
        source: doc.metadata.source as string,
        score: parseFloat(score.toFixed(4)),
      })),
    };
  }

  getStatus() {
    return {
      mode: 'MemoryVectorStore',
      loaded: !!this.vectorStore,
      docCount: this.docCount,
      message: this.vectorStore
        ? `已加载 ${this.docCount} 篇文档（内存）`
        : '知识库为空',
    };
  }

  clearKnowledge() {
    this.vectorStore = null;
    this.docCount = 0;
    return { success: true, message: '内存知识库已清空' };
  }
}
