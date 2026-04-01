import axios from 'axios'
import { Category, SourceType, config } from '../config'

export interface NewsArticle {
  title: string
  description: string
  url: string
  source: string
  publishedAt: Date
  category: Category
  sourceType: SourceType
}

interface SearchNewsOptions {
  since?: Date
  pageSize?: number
  domains?: string[]
}

interface TopHeadlineOptions {
  category: string
  localCategory: Category
  country?: string
  pageSize?: number
}

interface NewsAPIResponse {
  articles?: Array<{
    title?: string
    description?: string | null
    url?: string
    publishedAt?: string
    source?: {
      name?: string
    }
  }>
}

export class NewsAPICollector {
  private apiKey: string
  private baseUrl: string

  constructor() {
    this.apiKey = process.env.NEWS_API_KEY || ''
    this.baseUrl = config.collectors.newsApi.baseUrl
  }

  private get clampedDefaultSince(): Date {
    return new Date(Date.now() - config.collectors.newsApi.defaultLookbackHours * 60 * 60 * 1000)
  }

  private normalizeSince(since?: Date): Date {
    if (!since) {
      return this.clampedDefaultSince
    }

    const maxLookbackDate = new Date(Date.now() - config.collectors.newsApi.maxLookbackHours * 60 * 60 * 1000)
    return since < maxLookbackDate ? maxLookbackDate : since
  }

  private normalizeArticles(articles: NewsAPIResponse['articles'], category: Category): NewsArticle[] {
    if (!articles?.length) {
      return []
    }

    return articles
      .filter((article) => article.title && article.url)
      .map((article) => ({
        title: article.title || '',
        description: article.description || '',
        url: article.url || '',
        source: article.source?.name || 'NewsAPI',
        publishedAt: article.publishedAt ? new Date(article.publishedAt) : new Date(),
        category,
        sourceType: 'news' as const,
      }))
  }

  private async fetchEverything(query: string, category: Category, options: SearchNewsOptions = {}): Promise<NewsArticle[]> {
    if (!this.apiKey) {
      console.warn('NewsAPI key not configured, skipping...')
      return []
    }

    const since = this.normalizeSince(options.since)

    try {
      const response = await axios.get<NewsAPIResponse>(`${this.baseUrl}/everything`, {
        params: {
          apiKey: this.apiKey,
          q: query,
          language: 'en',
          sortBy: 'publishedAt',
          searchIn: 'title,description',
          domains: (options.domains || config.collectors.newsApi.trustedDomains).join(','),
          from: since.toISOString(),
          pageSize: options.pageSize || config.collectors.newsApi.pageSize,
        },
        timeout: config.collectors.newsApi.timeout,
      })

      return this.normalizeArticles(response.data.articles, category)
    } catch (error) {
      console.error(`NewsAPI search error for ${category}:`, error)
      return []
    }
  }

  async fetchTopHeadlines(options: TopHeadlineOptions): Promise<NewsArticle[]> {
    if (!this.apiKey) {
      console.warn('NewsAPI key not configured, skipping...')
      return []
    }

    try {
      const response = await axios.get<NewsAPIResponse>(`${this.baseUrl}/top-headlines`, {
        params: {
          apiKey: this.apiKey,
          category: options.category,
          country: options.country || 'us',
          pageSize: options.pageSize || Math.min(config.collectors.newsApi.pageSize, 10),
        },
        timeout: config.collectors.newsApi.timeout,
      })

      return this.normalizeArticles(response.data.articles, options.localCategory)
    } catch (error) {
      console.error(`NewsAPI top headlines error for ${options.category}:`, error)
      return []
    }
  }

  async fetchAINews(since?: Date): Promise<NewsArticle[]> {
    return this.fetchEverything(config.collectors.newsApi.categoryQueries.ai, 'ai', { since })
  }

  async fetchTechNews(since?: Date): Promise<NewsArticle[]> {
    return this.fetchEverything(config.collectors.newsApi.categoryQueries.tech, 'tech', { since })
  }

  async fetchScienceNews(since?: Date): Promise<NewsArticle[]> {
    return this.fetchEverything(config.collectors.newsApi.categoryQueries.science, 'science', { since })
  }

  async fetchWaterNews(since?: Date): Promise<NewsArticle[]> {
    return this.fetchEverything(config.collectors.newsApi.categoryQueries.water, 'water', { since })
  }

  async fetchCryptoNews(since?: Date): Promise<NewsArticle[]> {
    return this.fetchEverything(config.collectors.newsApi.categoryQueries.crypto, 'crypto', { since })
  }

  async fetchPoliticsNews(since?: Date): Promise<NewsArticle[]> {
    return this.fetchEverything(config.collectors.newsApi.categoryQueries.politics, 'politics', { since })
  }

  async fetchEconomyNews(since?: Date): Promise<NewsArticle[]> {
    return this.fetchEverything(config.collectors.newsApi.categoryQueries.economy, 'economy', { since })
  }

  async fetchHeadlineMix(): Promise<NewsArticle[]> {
    const headlineGroups = await Promise.all(
      config.collectors.newsApi.headlineCategories.map((headlineConfig) =>
        this.fetchTopHeadlines({
          category: headlineConfig.category,
          country: headlineConfig.country,
          localCategory: headlineConfig.localCategory as Category,
        })
      )
    )

    return headlineGroups.flat()
  }

  async fetchBreakingWatchlist(since?: Date): Promise<NewsArticle[]> {
    return this.fetchEverything(config.collectors.newsApi.breakingWatchQuery, 'tech', {
      since,
      pageSize: Math.min(config.collectors.newsApi.pageSize, 15),
    })
  }
}
