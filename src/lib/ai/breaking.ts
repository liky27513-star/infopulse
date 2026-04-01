import { ProcessedArticle } from './groq-processor'
import { prisma } from '../db'
import { config } from '../config'

export interface BreakingAlert {
  article: ProcessedArticle
  timestamp: Date
  reason: string
}

// 检测突发事件
export async function detectBreakingEvents(articles: ProcessedArticle[]): Promise<BreakingAlert[]> {
  const alerts: BreakingAlert[] = []

  for (const article of articles) {
    if (article.isBreaking) {
      alerts.push({
        article,
        timestamp: new Date(),
        reason: `重要性评分: ${article.importance}/10`,
      })
    }
  }

  return alerts
}

// 检查是否已经发送过该突发新闻
export async function hasBreakingNewsBeenSent(sourceUrl: string): Promise<boolean> {
  const existing = await prisma.newsItem.findFirst({
    where: {
      sourceUrl,
      isBreaking: true,
    },
  })

  return !!existing
}

// 过滤未发送的突发新闻
export async function filterUnsentBreakingNews(articles: ProcessedArticle[]): Promise<ProcessedArticle[]> {
  const unsent: ProcessedArticle[] = []

  for (const article of articles) {
    const sent = await hasBreakingNewsBeenSent(article.sourceUrl)
    if (!sent) {
      unsent.push(article)
    }
  }

  return unsent
}

// 监控特定关键词的突发新闻
export function monitorKeywords(article: ProcessedArticle, keywords: string[]): boolean {
  const text = `${article.title} ${article.summary}`.toLowerCase()
  return keywords.some((keyword) => text.includes(keyword.toLowerCase()))
}

// AI公司监控关键词
const AI_KEYWORDS = [
  'openai',
  'anthropic',
  'claude',
  'gpt',
  'gemini',
  'deepmind',
  'meta ai',
  'mistral',
  'deepseek',
]

// 加密货币监控关键词
const CRYPTO_KEYWORDS = ['bitcoin', 'ethereum', 'sec', 'etf', 'crypto regulation', 'defi']

// 政治监控关键词
const POLITICS_KEYWORDS = ['election', 'president', 'congress', 'policy', 'sanctions', 'treaty']
const SCIENCE_KEYWORDS = ['breakthrough', 'nature', 'science', 'physics', 'mathematics', 'peer-reviewed']
const WATER_KEYWORDS = ['hydrology', 'water resources', 'groundwater', 'drought', 'flood', 'watershed']

// 检测特定领域的突发新闻
export function detectCategoryBreakingNews(article: ProcessedArticle): {
  isBreaking: boolean
  category: string
  keywords: string[]
} {
  let keywords: string[] = []

  switch (article.category) {
    case 'ai':
      keywords = AI_KEYWORDS
      break
    case 'crypto':
      keywords = CRYPTO_KEYWORDS
      break
    case 'politics':
      keywords = POLITICS_KEYWORDS
      break
    case 'science':
      keywords = SCIENCE_KEYWORDS
      break
    case 'water':
      keywords = WATER_KEYWORDS
      break
    default:
      return { isBreaking: article.isBreaking, category: article.category, keywords: [] }
  }

  const hasKeyword = monitorKeywords(article, keywords)

  return {
    isBreaking: article.isBreaking && hasKeyword,
    category: article.category,
    keywords: keywords.filter((k) => monitorKeywords(article, [k])),
  }
}

// 生成突发新闻摘要
export function generateBreakingSummary(alerts: BreakingAlert[]): string {
  if (alerts.length === 0) return ''

  const summary = alerts
    .map((alert) => {
      const emoji = alert.article.importance >= 9 ? '🔴' : '🟡'
      return `${emoji} [${alert.article.category.toUpperCase()}] ${alert.article.title}\n   ${alert.article.summary}`
    })
    .join('\n\n')

  return summary
}

// 持续监控函数（用于定时任务）
export async function monitorBreakingNews(): Promise<BreakingAlert[]> {
  // 这个函数会在定时任务中调用
  // 1. 采集最新数据
  // 2. 处理数据
  // 3. 检测突发事件
  // 4. 发送通知

  console.log('Monitoring for breaking news...')
  // 实际实现会在scheduler.ts中
  return []
}
