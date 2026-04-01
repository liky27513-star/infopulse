import Parser from 'rss-parser'
import { Category, FeedSource, SourceType, config } from '../config'

export interface RSSArticle {
  title: string
  description: string
  url: string
  source: string
  publishedAt: Date
  category: Category
  sourceType: SourceType
}

export class RSSCollector {
  private parser: Parser

  constructor() {
    this.parser = new Parser({
      timeout: config.collectors.rss.timeout,
      headers: {
        'User-Agent': 'InfoPulse/1.0',
      },
    })
  }

  private normalizeSince(since?: Date): Date | undefined {
    if (!since) {
      return undefined
    }

    const maxLookbackDate = new Date(Date.now() - config.collectors.newsApi.maxLookbackHours * 60 * 60 * 1000)
    return since < maxLookbackDate ? maxLookbackDate : since
  }

  async fetchFeed(feed: FeedSource, since?: Date): Promise<RSSArticle[]> {
    try {
      const rss = await this.parser.parseURL(feed.url)
      const normalizedSince = this.normalizeSince(since)

      return rss.items
        .map((item) => ({
          title: item.title || '',
          description: item.contentSnippet || item.summary || item.content || '',
          url: item.link || '',
          source: feed.name,
          publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
          category: feed.category,
          sourceType: feed.sourceType,
        }))
        .filter((item) => item.url && item.title)
        .filter((item) => !normalizedSince || item.publishedAt >= normalizedSince)
        .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
        .slice(0, config.collectors.rss.itemsPerFeed)
    } catch (error) {
      console.error(`RSS feed fetch error for ${feed.name}:`, error)
      return []
    }
  }

  async fetchAllFeeds(since?: Date): Promise<RSSArticle[]> {
    const articles: RSSArticle[] = []

    for (const feed of config.rssFeeds) {
      const feedArticles = await this.fetchFeed(feed, since)
      articles.push(...feedArticles)
    }

    return articles
  }

  async fetchByCategory(category: Category, since?: Date): Promise<RSSArticle[]> {
    const feeds = config.rssFeeds.filter((feed) => feed.category === category)
    const articles: RSSArticle[] = []

    for (const feed of feeds) {
      const feedArticles = await this.fetchFeed(feed, since)
      articles.push(...feedArticles)
    }

    return articles
  }

  async fetchAIRSS(since?: Date): Promise<RSSArticle[]> {
    return this.fetchByCategory('ai', since)
  }

  async fetchTechRSS(since?: Date): Promise<RSSArticle[]> {
    return this.fetchByCategory('tech', since)
  }
}
