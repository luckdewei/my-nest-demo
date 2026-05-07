export const config = {
  // ── Ollama / LangChain 配置 ───────────────────────
  ollama: {
    // Ollama 服务地址，默认本机 11434 端口
    baseUrl: 'http://localhost:11434',

    // 对话模型：qwen3.5:0.8b（约 1GB）
    // 拉取命令：ollama pull qwen3.5:0.8b
    chatModel: 'qwen3.5:1.7b',

    // 向量化模型：mxbai-embed-large（RAG 检索用，约 669MB）
    // 拉取命令：ollama pull mxbai-embed-large
    embedModel: 'mxbai-embed-large',

    // 温度参数（0~1）
    // 0   = 最保守，每次输出几乎相同，适合问答/代码
    // 0.3 = 稍有变化，适合大多数场景
    // 0.7 = 较有创意，适合写作
    // 1.0 = 最随机，适合头脑风暴
    temperature: 0.3,
  },
};
