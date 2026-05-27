// src/agents/agents.service.ts

import { Injectable } from '@nestjs/common';
import { ChatOllama } from '@langchain/ollama';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import {
  HumanMessage,
  AIMessage,
  ToolMessage,
  SystemMessage,
  type BaseMessage,
} from '@langchain/core/messages';
import type { StructuredToolInterface } from '@langchain/core/tools';
import { config } from '../config';

@Injectable()
export class AgentsService {
  private llm = new ChatOllama({
    model: config.ollama.chatModel,
    baseUrl: config.ollama.baseUrl,
    temperature: 0.1, // 低温度，让工具调用决策更稳定
    think: false,
    numPredict: 1024,
  });

  // ══════════════════════════════════════════════════════
  // 工具定义
  // tool() 把普通 JS 函数包装成模型能识别的格式
  //   name：工具名（模型据此决定何时调用）
  //   description：工具描述（模型据此理解这个工具能干什么）
  //   schema：参数定义（zod 格式，告诉模型调用时传什么参数）
  // ══════════════════════════════════════════════════════

  // ── 工具一：查询商品库存和价格 ──────────────────────────
  private checkProductTool = tool(
    ({ productName }: { productName: string }) => {
      console.log(`[工具执行] check_product → 查询商品：${productName}`);

      // 模拟商品数据库（实际项目注入 PrismaService 查真实数据库）
      const products: Record<
        string,
        { price: number; stock: number; category: string }
      > = {
        'iPhone 16': { price: 7999, stock: 50, category: '手机' },
        'iPhone 16 Pro': { price: 9999, stock: 20, category: '手机' },
        'MacBook Pro': { price: 15999, stock: 8, category: '电脑' },
        'AirPods Pro': { price: 1799, stock: 200, category: '耳机' },
        'iPad Air': { price: 4799, stock: 30, category: '平板' },
      };

      const product = products[productName];

      if (!product) {
        return `商品「${productName}」不存在，请检查商品名称是否正确。`;
      }
      if (product.stock === 0) {
        return `商品「${productName}」当前缺货，预计下周补货。`;
      }

      return `商品「${productName}」有货，单价 ¥${product.price}，库存 ${product.stock} 件，分类：${product.category}。`;
    },
    {
      name: 'check_product',
      // description 非常关键：模型根据这段描述决定何时调用这个工具
      description:
        '查询商品是否有货、商品价格和库存数量。用户问"有没有XX"、"XX多少钱"、"XX有货吗"时调用。',
      schema: z.object({
        productName: z
          .string()
          .describe('商品名称，例如 iPhone 16、MacBook Pro'),
      }),
    },
  );

  // ── 工具二：创建订单 ────────────────────────────────────
  private createOrderTool = tool(
    ({
      productName,
      quantity,
      customerName,
    }: {
      productName: string;
      quantity: number;
      customerName: string;
    }) => {
      console.log(
        `[工具执行] create_order → ${customerName} 购买 ${productName} x${quantity}`,
      );

      const prices: Record<string, number> = {
        'iPhone 16': 7999,
        'iPhone 16 Pro': 9999,
        'MacBook Pro': 15999,
        'AirPods Pro': 1799,
        'iPad Air': 4799,
      };

      const unitPrice = prices[productName] ?? 0;
      const totalPrice = unitPrice * quantity;
      // 生成简短订单号，便于演示
      const orderId = `ORD-${Date.now().toString().slice(-6)}`;

      return `订单创建成功！订单号：${orderId}，客户：${customerName}，商品：${productName} x${quantity}，单价 ¥${unitPrice}，总价 ¥${totalPrice}。请在 30 分钟内完成支付。`;
    },
    {
      name: 'create_order',
      description:
        '为客户创建购买订单。需要知道商品名称、购买数量、客户姓名才能下单。用户说"我要买XX"、"帮我下单"时调用。',
      schema: z.object({
        productName: z.string().describe('商品名称'),
        quantity: z.number().describe('购买数量，默认为 1'),
        customerName: z.string().describe('客户姓名'),
      }),
    },
  );

  // ── 工具三：查询订单状态 ────────────────────────────────
  private checkOrderTool = tool(
    ({ orderId }: { orderId: string }) => {
      console.log(`[工具执行] check_order → 查询订单：${orderId}`);

      // 模拟订单状态（实际项目查数据库）
      const statuses = ['待支付', '已支付待发货', '已发货运输中', '已签收'];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const extra = status === '已发货运输中' ? '，预计明天送达' : '';

      return `订单 ${orderId} 当前状态：${status}${extra}。`;
    },
    {
      name: 'check_order',
      description:
        '查询订单的当前状态。用户说"我的订单"、"订单到哪了"、"查一下订单 ORD-XXX"时调用。',
      schema: z.object({
        orderId: z.string().describe('订单号，格式为 ORD-XXXXXX'),
      }),
    },
  );

  // ── 工具四：申请退款 ────────────────────────────────────
  private applyRefundTool = tool(
    ({ orderId, reason }: { orderId: string; reason: string }) => {
      console.log(`[工具执行] apply_refund → 订单 ${orderId}，原因：${reason}`);

      const refundId = `REF-${Date.now().toString().slice(-6)}`;
      return `退款申请已提交！退款单号：${refundId}，订单：${orderId}，退款原因：${reason}。预计 1-3 个工作日内退回原支付渠道，请注意查收。`;
    },
    {
      name: 'apply_refund',
      description:
        '为客户申请订单退款。用户说"我要退款"、"申请退货"、"不想要了"时调用。需要订单号和退款原因。',
      schema: z.object({
        orderId: z.string().describe('需要退款的订单号'),
        reason: z.string().describe('退款原因，例如：质量问题、不喜欢、买错了'),
      }),
    },
  );

  // ══════════════════════════════════════════════════════
  // Agent 核心执行逻辑
  // ══════════════════════════════════════════════════════
  async runAgent(userMessage: string) {
    const tools = [
      this.checkProductTool,
      this.createOrderTool,
      this.checkOrderTool,
      this.applyRefundTool,
    ];

    const toolMap: Record<string, StructuredToolInterface> = {
      check_product: this.checkProductTool,
      create_order: this.createOrderTool,
      check_order: this.checkOrderTool,
      apply_refund: this.applyRefundTool,
    };

    // bindTools：把工具列表注册到模型
    // 注册后模型回复里会包含 tool_calls 字段（当它决定调用工具时）
    const llmWithTools = this.llm.bindTools(tools);

    // 消息历史：Agent 每一轮都能看到完整的对话 + 工具结果
    const messages: BaseMessage[] = [
      // System 消息：设定客服角色和行为规范
      new SystemMessage(
        `你是「极速购」电商平台的 AI 智能客服助手。
你可以使用以下工具帮助客户：
- check_product：查询商品库存和价格
- create_order：为客户创建订单
- check_order：查询订单状态
- apply_refund：申请退款

工作原则：
1. 先用工具获取真实信息，再给客户答复
2. 下单前必须先查询库存确认有货
3. 下单需要知道客户姓名，如果用户没说，主动询问
4. 回答简洁友好，使用中文`,
      ),
      new HumanMessage(userMessage),
    ];

    // 记录每步执行过程（用于前端展示 / 课程演示）
    const steps: string[] = [];
    let roundCount = 0;

    // ── Agent 循环 ──────────────────────────────────────
    // 每一轮：模型看消息历史 → 决定调用工具还是直接回答
    // 直到模型不再调用工具为止（最多 6 轮，防止死循环）
    while (roundCount < 6) {
      roundCount++;
      console.log(`\n[Agent 第 ${roundCount} 轮]`);

      const response = await llmWithTools.invoke(messages);
      messages.push(response); // 把模型回复加入历史

      // tool_calls 为空 → 模型有了最终答案，退出循环
      if (!response.tool_calls || response.tool_calls.length === 0) {
        steps.push(`💬 [最终回答] ${response.content as string}`);
        break;
      }

      // 模型决定调用工具，依次执行所有工具调用
      for (const toolCall of response.tool_calls) {
        steps.push(
          `🔧 [调用工具] ${toolCall.name}(${JSON.stringify(toolCall.args)})`,
        );
        console.log(`[工具调用] ${toolCall.name}`, toolCall.args);

        const toolFn = toolMap[toolCall.name];
        if (!toolFn) {
          const errMsg = `工具「${toolCall.name}」不存在`;
          steps.push(`❌ [错误] ${errMsg}`);
          messages.push(
            new ToolMessage({ content: errMsg, tool_call_id: toolCall.id! }),
          );
          continue;
        }

        // 执行工具，获取结果
        const toolResult: string = (await toolFn.invoke(
          toolCall.args,
        )) as string;
        steps.push(`✅ [工具结果] ${toolResult}`);
        console.log(`[工具结果] ${toolResult}`);

        // 把工具结果加入消息历史
        // 模型下一轮看到结果后，再决定继续调工具还是直接回答
        messages.push(
          new ToolMessage({
            content: toolResult,
            tool_call_id: toolCall.id!,
          }),
        );
      }
    }

    // 获取最终回答（最后一条 AIMessage 的内容）
    const lastAI = [...messages].reverse().find((m) => m instanceof AIMessage);

    return {
      userMessage,
      steps, // 完整思考和执行步骤（录视频演示重点）
      totalRounds: roundCount,
      answer: lastAI ?? '抱歉，暂时无法处理您的请求',
    };
  }
}
