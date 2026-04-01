import Groq from 'groq-sdk'
import { Category, SourceType, config } from '../config'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

export interface ProcessedArticle {
  title: string
  summary: string
  detail: string
  category: Category
  sourceType: SourceType
  importance: number
  isBreaking: boolean
  source: string
  sourceUrl: string
  publishedAt: Date
}

const categoryList = Object.keys(config.categories) as Category[]

function truncate(text: string, maxLength: number) {
  return text.length <= maxLength ? text : `${text.slice(0, maxLength).trim()}...`
}

function normalizeCategory(value: string): Category {
  const normalized = value.trim().toLowerCase() as Category
  if (categoryList.includes(normalized)) {
    return normalized
  }

  const text = value.toLowerCase()
  if (text.includes('water') || text.includes('hydro')) return 'water'
  if (text.includes('science') || text.includes('physics') || text.includes('math')) return 'science'
  if (text.includes('ai') || text.includes('ml') || text.includes('machine')) return 'ai'
  if (text.includes('crypto')) return 'crypto'
  if (text.includes('politic')) return 'politics'
  if (text.includes('econom')) return 'economy'
  return 'tech'
}

function buildFallbackSummary(title: string, content: string) {
  return truncate(content?.trim() || title, 120)
}

function buildFallbackDetail(title: string, content: string, category: Category, sourceType: SourceType) {
  const intro = truncate(content?.trim() || title, 220)
  return `【发生了什么】${intro}\n\n【为什么值得关注】这条内容属于${config.categories[category]}，来源类型为${config.sourceTypes[sourceType]}，建议重点关注其后续影响、相关论文/产品进展及行业讨论。`
}

export async function generateSummary(title: string, content: string, category?: Category): Promise<string> {
  if (!process.env.GROQ_API_KEY) {
    return buildFallbackSummary(title, content)
  }

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: '你是一个新闻摘要助手。请用简洁中文给出一句摘要，控制在80字内。',
        },
        {
          role: 'user',
          content: `请总结以下内容，保留最核心的信息点。\n\n类别：${category ? config.categories[category] : '待分类'}\n标题：${title}\n内容：${content}\n\n摘要：`,
        },
      ],
      temperature: 0.2,
      max_tokens: 120,
    })

    return completion.choices[0]?.message?.content?.trim() || buildFallbackSummary(title, content)
  } catch (error) {
    console.error('Summary generation error:', error)
    return buildFallbackSummary(title, content)
  }
}

export async function generateDetailedIntroduction(
  title: string,
  content: string,
  category: Category,
  sourceType: SourceType
): Promise<string> {
  if (!process.env.GROQ_API_KEY) {
    return buildFallbackDetail(title, content, category, sourceType)
  }

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content:
            '你是一个情报编辑。请用中文写出结构化的详细介绍，包含【发生了什么】【为什么重要】【下一步关注】，总长度控制在220字以内。',
        },
        {
          role: 'user',
          content: `请处理以下内容：\n\n类别：${config.categories[category]}\n来源类型：${config.sourceTypes[sourceType]}\n标题：${title}\n内容：${content}\n\n详细介绍：`,
        },
      ],
      temperature: 0.3,
      max_tokens: 320,
    })

    return completion.choices[0]?.message?.content?.trim() || buildFallbackDetail(title, content, category, sourceType)
  } catch (error) {
    console.error('Detailed introduction generation error:', error)
    return buildFallbackDetail(title, content, category, sourceType)
  }
}

export async function classifyNews(title: string, content: string): Promise<Category> {
  if (!process.env.GROQ_API_KEY) {
    const text = `${title} ${content}`.toLowerCase()
    if (text.includes('water') || text.includes('hydrology') || text.includes('groundwater') || text.includes('flood') || text.includes('drought')) {
      return 'water'
    }
    if (text.includes('science') || text.includes('physics') || text.includes('mathematics') || text.includes('biology')) {
      return 'science'
    }
    if (text.includes('ai') || text.includes('artificial intelligence') || text.includes('openai') || text.includes('claude') || text.includes('gpt')) {
      return 'ai'
    }
    if (text.includes('crypto') || text.includes('bitcoin') || text.includes('ethereum') || text.includes('blockchain')) {
      return 'crypto'
    }
    if (text.includes('politics') || text.includes('election') || text.includes('government')) {
      return 'politics'
    }
    if (text.includes('economy') || text.includes('market') || text.includes('federal reserve') || text.includes('stock')) {
      return 'economy'
    }
    if (text.includes('prediction') || text.includes('polymarket')) {
      return 'prediction'
    }
    return 'tech'
  }

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: '你是一个新闻分类助手。只返回一个最合适的类别名称。',
        },
        {
          role: 'user',
          content: `请将以下内容分类。\n\n标题：${title}\n内容：${content}\n\n可选类别：${categoryList.join(', ')}\n\n只返回类别名称。`,
        },
      ],
      temperature: 0.1,
      max_tokens: 50,
    })

    return normalizeCategory(completion.choices[0]?.message?.content || 'tech')
  } catch (error) {
    console.error('Classification error:', error)
    return 'tech'
  }
}

export async function rateImportance(
  title: string,
  content: string,
  category?: Category,
  sourceType?: SourceType
): Promise<number> {
  if (!process.env.GROQ_API_KEY) {
    const text = `${title} ${content}`.toLowerCase()
    let score = 5

    if (text.includes('breaking') || text.includes('urgent') || text.includes('重大') || text.includes('breakthrough')) score += 2
    if (text.includes('openai') || text.includes('anthropic') || text.includes('google deepmind')) score += 1
    if (text.includes('gpt') || text.includes('claude') || text.includes('gemini')) score += 1
    if (text.includes('sec') || text.includes('federal reserve')) score += 1
    if (text.includes('nature') || text.includes('science') || text.includes('journal') || text.includes('paper')) score += 1
    if (category === 'water' || category === 'science') score += 1
    if (sourceType === 'journal' || sourceType === 'paper' || sourceType === 'official') score += 1

    return Math.min(10, Math.max(1, score))
  }

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: '你是一个情报重要性评估助手。只返回1到10之间的整数。',
        },
        {
          role: 'user',
          content: `请评估以下内容的重要性。\n\n类别：${category ? config.categories[category] : '待分类'}\n来源类型：${sourceType ? config.sourceTypes[sourceType] : '未知'}\n标题：${title}\n内容：${content}\n\n评分标准：9-10 为重大突破/重大政策/重大市场信号；7-8 为值得重点跟踪；5-6 为常规重要更新。\n\n只返回数字。`,
        },
      ],
      temperature: 0.2,
      max_tokens: 10,
    })

    const scoreText = completion.choices[0]?.message?.content?.trim() || '5'
    const score = parseInt(scoreText, 10)
    return Number.isNaN(score) ? 5 : Math.min(10, Math.max(1, score))
  } catch (error) {
    console.error('Importance rating error:', error)
    return 5
  }
}

export async function detectBreakingNews(
  title: string,
  content: string,
  importance: number,
  category?: Category
): Promise<boolean> {
  if (importance >= config.importanceThreshold.breaking) {
    return true
  }

  if (!process.env.GROQ_API_KEY) {
    const text = `${title} ${content}`.toLowerCase()
    const breakingKeywords = ['breaking', 'urgent', 'emergency', '突发', '紧急', '重大', 'just in', 'exclusive', 'breakthrough']
    if (category === 'ai' && (text.includes('openai') || text.includes('anthropic') || text.includes('deepmind'))) {
      return importance >= 8
    }
    return breakingKeywords.some((keyword) => text.includes(keyword))
  }

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: '你是一个突发事件检测助手。只回答“是”或“否”。',
        },
        {
          role: 'user',
          content: `判断以下内容是否属于需要立即提醒的突发事件。\n\n类别：${category ? config.categories[category] : '待分类'}\n标题：${title}\n内容：${content}\n重要性：${importance}/10\n\n突发事件包括：重大政策变化、重大科研/AI突破、重大市场波动、重大地缘政治事件。\n\n只返回“是”或“否”。`,
        },
      ],
      temperature: 0.1,
      max_tokens: 10,
    })

    return (completion.choices[0]?.message?.content?.trim() || '否') === '是'
  } catch (error) {
    console.error('Breaking news detection error:', error)
    return false
  }
}

export async function generateDigestOverview(
  articles: Array<Pick<ProcessedArticle, 'title' | 'summary' | 'category' | 'sourceType'>>
): Promise<string> {
  if (articles.length === 0) {
    return '今天暂时没有抓到值得推送的重要更新。'
  }

  if (!process.env.GROQ_API_KEY) {
    const categoriesUsed = Array.from(new Set(articles.slice(0, 6).map((article) => config.categories[article.category])))
    const topTitles = articles.slice(0, 3).map((article) => article.title).join('；')
    return `今天重点覆盖${categoriesUsed.join('、')}，核心事件包括：${truncate(topTitles, 70)}`
  }

  try {
    const material = articles
      .slice(0, 8)
      .map(
        (article, index) =>
          `${index + 1}. [${config.categories[article.category]} | ${config.sourceTypes[article.sourceType]}] ${article.title} - ${article.summary}`
      )
      .join('\n')

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: '你是一个邮件主编。请把今日内容写成一句中文总览，80字内，兼顾 AI、科学和行业要点。',
        },
        {
          role: 'user',
          content: `请为以下清单写一句“今日总览”：\n\n${material}\n\n今日总览：`,
        },
      ],
      temperature: 0.3,
      max_tokens: 120,
    })

    return completion.choices[0]?.message?.content?.trim() || '今天的重点情报已整理如下。'
  } catch (error) {
    console.error('Digest overview generation error:', error)
    return '今天的重点情报已整理如下。'
  }
}

export async function processArticle(article: {
  title: string
  description: string
  url: string
  source: string
  publishedAt: Date
  category?: Category
  sourceType?: SourceType
}): Promise<ProcessedArticle> {
  const category = article.category || (await classifyNews(article.title, article.description))
  const sourceType = article.sourceType || 'news'

  const [summary, detail, importance] = await Promise.all([
    generateSummary(article.title, article.description, category),
    generateDetailedIntroduction(article.title, article.description, category, sourceType),
    rateImportance(article.title, article.description, category, sourceType),
  ])

  const isBreaking = await detectBreakingNews(article.title, article.description, importance, category)

  return {
    title: article.title,
    summary,
    detail,
    category,
    sourceType,
    importance,
    isBreaking,
    source: article.source,
    sourceUrl: article.url,
    publishedAt: article.publishedAt,
  }
}

export async function processArticles(articles: Array<{
  title: string
  description: string
  url: string
  source: string
  publishedAt: Date
  category?: Category
  sourceType?: SourceType
}>): Promise<ProcessedArticle[]> {
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
