import axios from 'axios'
import { config, Category } from '../config'

export interface NewsArticle {
  title: string
  description: string
  url: string
  source: string
  publishedAt: Date
  category: Category
}

export class NewsAPICollector {
  private apiKey: string
  private baseUrl: string

  constructor() {
    this.apiKey = process.env.NEWS_API_KEY || ''
    this.baseUrl = config.collectors.newsApi.baseUrl
  }

  async fetchTopHeadlines(category: string = 'technology'): Promise<NewsArticle[]> {
    if (!this.apiKey) {
      console.warn('NewsAPI key not configured, skipping...')
      return []
    }

    try {
      const response = await axios.get(`${this.baseUrl}/top-headlines`, {
        params: {
          apiKey: this.apiKey,
          category: category,
          language: 'en',
          pageSize: 20,
        },
        timeout: config.collectors.newsApi.timeout,
      })

      return response.data.articles.map((article: any) => ({
        title: article.title,
        description: article.description || '',
        url: article.url,
        source: article.source.name,
        publishedAt: new Date(article.publishedAt),
        category: 'tech' as Category,
      }))
    } catch (error) {
      console.error('NewsAPI fetch error:', error)
      return []
    }
  }

  async searchNews(query: string, category: Category): Promise<NewsArticle[]> {
    if (!this.apiKey) {
      console.warn('NewsAPI key not configured, skipping...')
      return []
    }

    try {
      const response = await axios.get(`${this.baseUrl}/everything`, {
        params: {
          apiKey: this.apiKey,
          q: query,
          language: 'en',
          sortBy: 'publishedAt',
          pageSize: 10,
        },
        timeout: config.collectors.newsApi.timeout,
      })

      return response.data.articles.map((article: any) => ({
        title: article.title,
        description: article.description || '',
        url: article.url,
        source: article.source.name,
        publishedAt: new Date(article.publishedAt),
        category: category,
      }))
    } catch (error) {
      console.error('NewsAPI search error:', error)
      return []
    }
  }

  // 获取AI相关新闻
  async fetchAINews(): Promise<NewsArticle[]> {
    const queries = ['OpenAI', 'Anthropic Claude', 'Google DeepMind', 'Meta AI', 'artificial intelligence']
    const articles: NewsArticle[] = []

    for (const query of queries) {
      const results = await this.searchNews(query, 'ai')
      articles.push(...results)
    }

    return articles
  }

  // 获取加密货币新闻
  async fetchCryptoNews(): Promise<NewsArticle[]> {
    const queries = ['Bitcoin', 'Ethereum', 'cryptocurrency', 'DeFi']
    const articles: NewsArticle[] = []

    for (const query of queries) {
      const results = await this.searchNews(query, 'crypto')
      articles.push(...results)
    }

    return articles
  }

  // 获取政治新闻
  async fetchPoliticsNews(): Promise<NewsArticle[]> {
    return this.searchNews('politics geopolitics', 'politics')
  }

  // 获取经济新闻
  async fetchEconomyNews(): Promise<NewsArticle[]> {
    const queries = ['economy', 'Federal Reserve', 'stock market', 'finance']
    const articles: NewsArticle[] = []

    for (const query of queries) {
      const results = await this.searchNews(query, 'economy')
      articles.push(...results)
    }

    return articles
  }
}
