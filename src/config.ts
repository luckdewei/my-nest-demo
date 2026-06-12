export const config = {
    langGraph: {
        model: process.env.DEEPSEEK_MODEL || 'deepseek-v4-pro',
        baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
        apiKey: process.env.DEEPSEEK_API_KEY || '',
        temperature: 0.7,
    },
}