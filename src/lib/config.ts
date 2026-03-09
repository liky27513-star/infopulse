// 全局配置

export const config = {
  // 新闻分类
  categories: {
    ai: 'AI & 大模型',
    tech: '科技',
    politics: '政治',
    economy: '经济 & 金融',
    crypto: '加密货币',
    prediction: '预测市场',
  },

  // 定时推送时间 (北京时间)
  scheduledTimes: ['09:00', '15:00', '21:00', '03:00'],

  // 重要性阈值
  importanceThreshold: {
    breaking: 9, // 突发事件阈值
    featured: 7, // 重点新闻阈值
  },

  // 数据采集配置
  collectors: {
    newsApi: {
      baseUrl: 'https://newsapi.org/v2',
      timeout: 10000,
    },
    coinGecko: {
      baseUrl: 'https://api.coingecko.com/api/v3',
      timeout: 10000,
    },
    polymarket: {
      baseUrl: 'https://gamma-api.polymarket.com',
      timeout: 10000,
    },
    alphaVantage: {
      baseUrl: 'https://www.alphavantage.co',
      timeout: 10000,
    },
  },

  // RSS订阅源
  rssFeeds: [
    { name: 'OpenAI Blog', url: 'https://openai.com/blog/rss.xml', category: 'ai' },
    { name: 'Anthropic Blog', url: 'https://www.anthropic.com/news/rss', category: 'ai' },
    { name: 'Google AI Blog', url: 'https://blog.google/technology/ai/rss/', category: 'ai' },
    { name: 'MIT Technology Review', url: 'https://www.technologyreview.com/feed/', category: 'tech' },
    { name: 'Wired', url: 'https://www.wired.com/feed/rss', category: 'tech' },
  ],

  // 邮件配置
  email: {
    from: process.env.SMTP_USER || 'infopulse@example.com',
    fromName: 'InfoPulse 智能简报',
  },

  // 默认收件人
  defaultRecipient: process.env.DEFAULT_RECIPIENT || '3421637305@qq.com',

  // 站点URL
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
}

export type Category = keyof typeof config.categories
