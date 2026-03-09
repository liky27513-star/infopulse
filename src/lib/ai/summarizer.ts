import Anthropic from '@anthropic-ai/sdk'
import { Category, config } from '../config'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface ProcessedArticle {
  title: string
  summary: string
  category: Category
  importance: number
  isBreaking: boolean
  source: string
  sourceUrl: string
  publishedAt: Date
}

// 生成中文摘要
export async function generateSummary(title: string, content: string): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('Anthropic API key not configured, using original content')
    return content.substring(0, 200)
  }

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6-20250514',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: `请用简洁的中文总结以下新闻（不超过150字）：

标题：${title}
内容：${content}

摘要：`,
        },
      ],
    })

    const summary = message.content[0].type === 'text' ? message.content[0].text : ''
    return summary.trim()
  } catch (error) {
    console.error('Summary generation error:', error)
    return content.substring(0, 200)
  }
}

// 分类新闻
export async function classifyNews(title: string, content: string): Promise<Category> {
  if (!process.env.ANTHROPIC_API_KEY) {
    // 简单的关键词匹配作为后备方案
    const text = `${title} ${content}`.toLowerCase()
    if (text.includes('ai') || text.includes('artificial intelligence') || text.includes('openai') || text.includes('claude')) {
      return 'ai'
    }
    if (text.includes('crypto') || text.includes('bitcoin') || text.includes('ethereum')) {
      return 'crypto'
    }
    if (text.includes('politics') || text.includes('election') || text.includes('government')) {
      return 'politics'
    }
    if (text.includes('economy') || text.includes('market') || text.includes('federal reserve')) {
      return 'economy'
    }
    if (text.includes('prediction') || text.includes('polymarket')) {
      return 'prediction'
    }
    return 'tech'
  }

  try {
    const categories = Object.keys(config.categories).join(', ')

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6-20250514',
      max_tokens: 50,
      messages: [
        {
          role: 'user',
          content: `请将以下新闻分类到最合适的类别。

标题：${title}
内容：${content}

可选类别：${categories}

只返回类别名称，不要其他内容。`,
        },
      ],
    })

    const category = message.content[0].type === 'text' ? message.content[0].text.trim().toLowerCase() : 'tech'
    return category as Category
  } catch (error) {
    console.error('Classification error:', error)
    return 'tech'
  }
}

// 评估重要性（1-10分）
export async function rateImportance(title: string, content: string): Promise<number> {
  if (!process.env.ANTHROPIC_API_KEY) {
    // 简单的关键词评分作为后备方案
    const text = `${title} ${content}`.toLowerCase()
    let score = 5

    if (text.includes('breaking') || text.includes('urgent') || text.includes('重大')) score += 2
    if (text.includes('openai') || text.includes('anthropic') || text.includes('google deepmind')) score += 1
    if (text.includes('gpt') || text.includes('claude') || text.includes('gemini')) score += 1
    if (text.includes('sec') || text.includes('federal reserve')) score += 1

    return Math.min(10, Math.max(1, score))
  }

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6-20250514',
      max_tokens: 10,
      messages: [
        {
          role: 'user',
          content: `请评估以下新闻的重要性（1-10分）：

标题：${title}
内容：${content}

评分标准：
- 1-3: 不重要的日常新闻
- 4-6: 一般重要性的新闻
- 7-8: 重要新闻，值得关注
- 9-10: 重大突发事件，需要立即关注

只返回数字分数，不要其他内容。`,
        },
      ],
    })

    const scoreText = message.content[0].type === 'text' ? message.content[0].text.trim() : '5'
    const score = parseInt(scoreText)
    return isNaN(score) ? 5 : Math.min(10, Math.max(1, score))
  } catch (error) {
    console.error('Importance rating error:', error)
    return 5
  }
}

// 检测是否为突发事件
export async function detectBreakingNews(title: string, content: string, importance: number): Promise<boolean> {
  // 如果重要性评分 >= 9，直接标记为突发
  if (importance >= config.importanceThreshold.breaking) {
    return true
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    // 简单的关键词检测
    const text = `${title} ${content}`.toLowerCase()
    const breakingKeywords = ['breaking', 'urgent', 'emergency', '突发', '紧急', '重大']
    return breakingKeywords.some((keyword) => text.includes(keyword))
  }

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6-20250514',
      max_tokens: 10,
      messages: [
        {
          role: 'user',
          content: `判断以下新闻是否为突发事件（需要立即通知）：

标题：${title}
内容：${content}

突发事件定义：
- 重大政策变化
- 重大技术突破
- 重大市场波动
- 重大政治事件
- 其他需要立即关注的紧急事件

只返回 "是" 或 "否"。`,
        },
      ],
    })

    const answer = message.content[0].type === 'text' ? message.content[0].text.trim() : '否'
    return answer === '是'
  } catch (error) {
    console.error('Breaking news detection error:', error)
    return false
  }
}

// 处理单篇文章
export async function processArticle(article: {
  title: string
  description: string
  url: string
  source: string
  publishedAt: Date
  category?: Category
}): Promise<ProcessedArticle> {
  // 并行执行所有AI任务
  const [summary, category, importance] = await Promise.all([
    generateSummary(article.title, article.description),
    article.category ? Promise.resolve(article.category) : classifyNews(article.title, article.description),
    rateImportance(article.title, article.description),
  ])

  const isBreaking = await detectBreakingNews(article.title, article.description, importance)

  return {
    title: article.title,
    summary,
    category,
    importance,
    isBreaking,
    source: article.source,
    sourceUrl: article.url,
    publishedAt: article.publishedAt,
  }
}

// 批量处理文章
export async function processArticles(articles: any[]): Promise<ProcessedArticle[]> {
  const processed: ProcessedArticle[] = []

  for (const article of articles) {
    try {
      const result = await processArticle(article)
      processed.push(result)
    } catch (error) {
      console.error('Article processing error:', error)
    }
  }

  return processed
}
