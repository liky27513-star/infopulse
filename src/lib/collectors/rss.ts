import Parser from 'rss-parser'
import { config, Category } from '../config'

export interface RSSArticle {
  title: string
  description: string
  url: string
  source: string
  publishedAt: Date
  category: Category
}

export class RSSCollector {
  private parser: Parser

  constructor() {
    this.parser = new Parser({
      timeout: 10000,
      headers: {
        'User-Agent': 'InfoPulse/1.0',
      },
    })
  }

  // 获取单个RSS源的文章
  async fetchFeed(feedUrl: string, sourceName: string, category: Category): Promise<RSSArticle[]> {
    try {
      const feed = await this.parser.parseURL(feedUrl)

      return feed.items.slice(0, 10).map((item) => ({
        title: item.title || '',
        description: item.contentSnippet || item.summary || '',
        url: item.link || '',
        source: sourceName,
        publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
        category: category,
      }))
    } catch (error) {
      console.error(`RSS feed fetch error for ${sourceName}:`, error)
      return []
    }
  }

  // 获取所有RSS源的文章
  async fetchAllFeeds(): Promise<RSSArticle[]> {
    const articles: RSSArticle[] = []

    for (const feed of config.rssFeeds) {
      const feedArticles = await this.fetchFeed(feed.url, feed.name, feed.category as Category)
      articles.push(...feedArticles)
    }

    return articles
  }

  // 获取特定类别的RSS文章
  async fetchByCategory(category: Category): Promise<RSSArticle[]> {
    const feeds = config.rssFeeds.filter((f) => f.category === category)
    const articles: RSSArticle[] = []

    for (const feed of feeds) {
      const feedArticles = await this.fetchFeed(feed.url, feed.name, category)
      articles.push(...feedArticles)
    }

    return articles
  }

  // 获取AI相关RSS文章
  async fetchAIRSS(): Promise<RSSArticle[]> {
    return this.fetchByCategory('ai')
  }

  // 获取科技相关RSS文章
  async fetchTechRSS(): Promise<RSSArticle[]> {
    return this.fetchByCategory('tech')
  }
}
