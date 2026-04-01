// 全局配置

const readNumberEnv = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(value || '', 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

const categories = {
  ai: 'AI & 大模型',
  tech: '科技产业',
  science: '科学突破',
  water: '水资源 & 水文',
  politics: '政治',
  economy: '经济 & 金融',
  crypto: '加密货币',
  prediction: '预测市场',
} as const

const sourceTypes = {
  news: '新闻',
  official: '官方/厂商',
  paper: '论文/预印本',
  journal: '期刊/学术',
  community: '社区热议',
  social: '专家观点',
  market: '市场信号',
} as const

export type Category = keyof typeof categories
export type SourceType = keyof typeof sourceTypes

export interface FeedSource {
  name: string
  url: string
  category: Category
  sourceType: SourceType
  priority?: number
}

export interface JournalSource {
  name: string
  issn: string
  category: Category
  sourceType: Extract<SourceType, 'journal' | 'paper'>
  priority?: number
}

const defaultCategories: Category[] = ['ai', 'tech', 'science', 'water', 'politics', 'economy', 'crypto', 'prediction']

export const config = {
  // 统一时区
  timeZone: 'Asia/Shanghai',

  categories,
  sourceTypes,
  defaultCategories,

  // 定时推送时间 (北京时间)
  scheduledTimes: ['08:00', '14:00', '20:00'],

  scheduler: {
    timezone: 'Asia/Shanghai',
    digestHours: [8, 14, 20],
    digestCronExpressions: [
      '0 8 * * *', // 08:00
      '0 14 * * *', // 14:00
      '0 20 * * *', // 20:00
    ],
    breakingCronExpression: '*/30 * * * *',
    digestFallbackLookbackHours: readNumberEnv(process.env.DIGEST_LOOKBACK_HOURS, 24),
    digestBufferMinutes: readNumberEnv(process.env.DIGEST_BUFFER_MINUTES, 20),
    breakingLookbackHours: readNumberEnv(process.env.BREAKING_LOOKBACK_HOURS, 4),
    maxDigestArticles: readNumberEnv(process.env.MAX_DIGEST_ARTICLES, 60),
    maxBreakingArticles: readNumberEnv(process.env.MAX_BREAKING_ARTICLES, 25),
    enableLocalCron:
      process.env.ENABLE_LOCAL_CRON !== undefined
        ? process.env.ENABLE_LOCAL_CRON === 'true'
        : !process.env.VERCEL,
  },

  // 重要性阈值
  importanceThreshold: {
    breaking: 9,
    featured: 7,
  },

  // 数据采集配置
  collectors: {
    newsApi: {
      baseUrl: 'https://newsapi.org/v2',
      timeout: 10000,
      defaultLookbackHours: readNumberEnv(process.env.NEWS_API_LOOKBACK_HOURS, 36),
      maxLookbackHours: readNumberEnv(process.env.NEWS_API_MAX_LOOKBACK_HOURS, 72),
      pageSize: readNumberEnv(process.env.NEWS_API_PAGE_SIZE, 20),
      trustedDomains: [
        'reuters.com',
        'apnews.com',
        'bloomberg.com',
        'ft.com',
        'wsj.com',
        'theverge.com',
        'techcrunch.com',
        'wired.com',
        'coindesk.com',
        'cointelegraph.com',
        'nature.com',
        'science.org',
      ],
      categoryQueries: {
        ai: '("OpenAI" OR Anthropic OR "Google DeepMind" OR "Meta AI" OR "large language model" OR "AI model" OR "machine learning")',
        tech: '(technology OR startup OR semiconductor OR cloud OR cybersecurity OR "big tech")',
        science: '(science OR research OR laboratory OR breakthrough OR physics OR mathematics OR biology)',
        water: '(hydrology OR "water resources" OR watershed OR drought OR flood OR groundwater OR hydroclimate)',
        politics: '(politics OR geopolitics OR election OR congress OR diplomacy OR "white house")',
        economy: '(economy OR inflation OR recession OR "Federal Reserve" OR "stock market" OR finance)',
        crypto: '(bitcoin OR ethereum OR cryptocurrency OR defi OR stablecoin OR "crypto ETF")',
      },
      breakingWatchQuery:
        '("OpenAI" OR Anthropic OR "Federal Reserve" OR Bitcoin OR Ethereum OR election OR geopolitics OR tariff OR semiconductor OR cybersecurity OR breakthrough)',
      headlineCategories: [
        { category: 'technology', country: 'us', localCategory: 'tech' },
        { category: 'business', country: 'us', localCategory: 'economy' },
        { category: 'science', country: 'us', localCategory: 'science' },
      ],
    },
    rss: {
      timeout: 10000,
      itemsPerFeed: readNumberEnv(process.env.RSS_ITEMS_PER_FEED, 12),
    },
    crossref: {
      baseUrl: 'https://api.crossref.org/works',
      timeout: 12000,
      rowsPerJournal: readNumberEnv(process.env.CROSSREF_ROWS_PER_JOURNAL, 8),
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

  // RSS 订阅源：官方、社区、论文/资讯
  rssFeeds: [
    { name: 'OpenAI Blog', url: 'https://openai.com/blog/rss.xml', category: 'ai', sourceType: 'official', priority: 10 },
    { name: 'Anthropic News', url: 'https://www.anthropic.com/news/rss', category: 'ai', sourceType: 'official', priority: 10 },
    { name: 'Google AI Blog', url: 'https://blog.google/technology/ai/rss/', category: 'ai', sourceType: 'official', priority: 10 },
    { name: 'arXiv cs.AI', url: 'https://export.arxiv.org/rss/cs.AI', category: 'ai', sourceType: 'paper', priority: 9 },
    { name: 'arXiv cs.LG', url: 'https://export.arxiv.org/rss/cs.LG', category: 'ai', sourceType: 'paper', priority: 9 },
    { name: 'arXiv cs.CL', url: 'https://export.arxiv.org/rss/cs.CL', category: 'ai', sourceType: 'paper', priority: 9 },
    {
      name: 'Hacker News AI',
      url: 'https://hnrss.org/newest?q=AI+OR+LLM+OR+OpenAI+OR+Anthropic+OR+DeepMind&search_attrs=title,url&points=20',
      category: 'ai',
      sourceType: 'community',
      priority: 8,
    },
    {
      name: 'Hacker News Science',
      url: 'https://hnrss.org/newest?q=physics+OR+math+OR+research+OR+science&search_attrs=title,url&points=15',
      category: 'science',
      sourceType: 'community',
      priority: 7,
    },
    { name: 'Reddit MachineLearning', url: 'https://www.reddit.com/r/MachineLearning/.rss', category: 'ai', sourceType: 'community', priority: 8 },
    { name: 'Reddit artificial', url: 'https://www.reddit.com/r/artificial/.rss', category: 'ai', sourceType: 'community', priority: 7 },
    { name: 'Reddit science', url: 'https://www.reddit.com/r/science/.rss', category: 'science', sourceType: 'community', priority: 7 },
    { name: 'MIT Technology Review', url: 'https://www.technologyreview.com/feed/', category: 'tech', sourceType: 'news', priority: 7 },
    { name: 'Wired', url: 'https://www.wired.com/feed/rss', category: 'tech', sourceType: 'news', priority: 6 },
    { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', category: 'tech', sourceType: 'news', priority: 6 },
    { name: 'Quanta Magazine', url: 'https://www.quantamagazine.org/feed/', category: 'science', sourceType: 'news', priority: 8 },
  ] satisfies FeedSource[],

  // 重点期刊 / 学术来源（通过 Crossref 拉取最新条目）
  journals: [
    { name: 'Nature', issn: '1476-4687', category: 'science', sourceType: 'journal', priority: 10 },
    { name: 'Science', issn: '0036-8075', category: 'science', sourceType: 'journal', priority: 10 },
    { name: 'Nature Machine Intelligence', issn: '2522-5839', category: 'ai', sourceType: 'journal', priority: 9 },
    { name: 'Journal of Machine Learning Research', issn: '1533-7928', category: 'ai', sourceType: 'journal', priority: 8 },
    { name: 'Water Resources Research', issn: '1944-7973', category: 'water', sourceType: 'journal', priority: 10 },
    { name: 'Journal of Hydrology', issn: '1879-2707', category: 'water', sourceType: 'journal', priority: 10 },
  ] satisfies JournalSource[],

  // 邮件配置
  email: {
    from: process.env.SMTP_USER || 'infopulse@example.com',
    fromName: 'InfoPulse 智能情报简报',
  },

  // 默认收件人
  defaultRecipient: process.env.DEFAULT_RECIPIENT || '3421637305@qq.com',

  // 站点URL
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
}
