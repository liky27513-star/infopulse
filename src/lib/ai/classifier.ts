import { ProcessedArticle } from './summarizer'
import { Category } from '../config'

// 去重：基于URL和标题相似度
export function deduplicateArticles(articles: ProcessedArticle[]): ProcessedArticle[] {
  const seen = new Map<string, ProcessedArticle>()

  for (const article of articles) {
    // 使用URL作为唯一标识
    if (!seen.has(article.sourceUrl)) {
      seen.set(article.sourceUrl, article)
    } else {
      // 如果已存在，保留重要性更高的
      const existing = seen.get(article.sourceUrl)!
      if (article.importance > existing.importance) {
        seen.set(article.sourceUrl, article)
      }
    }
  }

  return Array.from(seen.values())
}

// 按类别分组
export function groupByCategory(articles: ProcessedArticle[]): Map<Category, ProcessedArticle[]> {
  const grouped = new Map<Category, ProcessedArticle[]>()

  for (const article of articles) {
    const category = article.category
    if (!grouped.has(category)) {
      grouped.set(category, [])
    }
    grouped.get(category)!.push(article)
  }

  return grouped
}

// 按重要性排序
export function sortByImportance(articles: ProcessedArticle[]): ProcessedArticle[] {
  return articles.sort((a, b) => b.importance - a.importance)
}

// 过滤突发事件
export function filterBreakingNews(articles: ProcessedArticle[]): ProcessedArticle[] {
  return articles.filter((article) => article.isBreaking)
}

// 过滤重要新闻（重要性 >= 7）
export function filterImportantNews(articles: ProcessedArticle[]): ProcessedArticle[] {
  return articles.filter((article) => article.importance >= 7)
}

// 获取每个类别的Top N新闻
export function getTopNewsByCategory(articles: ProcessedArticle[], n: number = 5): Map<Category, ProcessedArticle[]> {
  const grouped = groupByCategory(articles)
  const topNews = new Map<Category, ProcessedArticle[]>()

  for (const [category, categoryArticles] of grouped) {
    const sorted = sortByImportance(categoryArticles)
    topNews.set(category, sorted.slice(0, n))
  }

  return topNews
}

// 生成新闻摘要统计
export function generateStatistics(articles: ProcessedArticle[]): {
  total: number
  byCategory: Record<Category, number>
  breaking: number
  important: number
} {
  const grouped = groupByCategory(articles)
  const byCategory: Record<Category, number> = {} as any

  for (const [category, categoryArticles] of grouped) {
    byCategory[category] = categoryArticles.length
  }

  return {
    total: articles.length,
    byCategory,
    breaking: filterBreakingNews(articles).length,
    important: filterImportantNews(articles).length,
  }
}

// 时间范围过滤
export function filterByTimeRange(articles: ProcessedArticle[], hoursAgo: number): ProcessedArticle[] {
  const cutoff = new Date(Date.now() - hoursAgo * 60 * 60 * 1000)
  return articles.filter((article) => article.publishedAt >= cutoff)
}

// 合并相似新闻（简单的标题相似度检测）
export function mergeSimilarNews(articles: ProcessedArticle[]): ProcessedArticle[] {
  const merged: ProcessedArticle[] = []
  const used = new Set<string>()

  for (let i = 0; i < articles.length; i++) {
    if (used.has(articles[i].sourceUrl)) continue

    const similar: ProcessedArticle[] = [articles[i]]
    used.add(articles[i].sourceUrl)

    // 查找相似新闻
    for (let j = i + 1; j < articles.length; j++) {
      if (used.has(articles[j].sourceUrl)) continue

      const similarity = calculateTitleSimilarity(articles[i].title, articles[j].title)
      if (similarity > 0.7) {
        similar.push(articles[j])
        used.add(articles[j].sourceUrl)
      }
    }

    // 如果有相似新闻，选择最重要的作为主新闻
    if (similar.length > 1) {
      const main = similar.sort((a, b) => b.importance - a.importance)[0]
      merged.push(main)
    } else {
      merged.push(articles[i])
    }
  }

  return merged
}

// 计算标题相似度（简单的词重叠率）
function calculateTitleSimilarity(title1: string, title2: string): number {
  const words1 = new Set(title1.toLowerCase().split(/\s+/))
  const words2 = new Set(title2.toLowerCase().split(/\s+/))

  const intersection = new Set([...words1].filter((x) => words2.has(x)))
  const union = new Set([...words1, ...words2])

  return intersection.size / union.size
}
