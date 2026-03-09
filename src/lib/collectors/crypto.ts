import axios from 'axios'
import { config, Category } from '../config'

export interface CryptoData {
  id: string
  name: string
  symbol: string
  current_price: number
  price_change_percentage_24h: number
  market_cap: number
  total_volume: number
  last_updated: string
}

export interface CryptoNews {
  title: string
  description: string
  url: string
  source: string
  publishedAt: Date
  category: Category
}

export class CoinGeckoCollector {
  private apiKey: string
  private baseUrl: string

  constructor() {
    this.apiKey = process.env.COINGECKO_API_KEY || ''
    this.baseUrl = config.collectors.coinGecko.baseUrl
  }

  // 获取主要加密货币价格
  async fetchTopCryptos(): Promise<CryptoData[]> {
    try {
      const headers: any = {}
      if (this.apiKey) {
        headers['x-cg-demo-api-key'] = this.apiKey
      }

      const response = await axios.get(`${this.baseUrl}/coins/markets`, {
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: 20,
          page: 1,
          sparkline: false,
          price_change_percentage: '24h',
        },
        headers,
        timeout: config.collectors.coinGecko.timeout,
      })

      return response.data
    } catch (error) {
      console.error('CoinGecko fetch error:', error)
      return []
    }
  }

  // 获取特定币种信息
  async fetchCoinDetails(coinId: string): Promise<any> {
    try {
      const headers: any = {}
      if (this.apiKey) {
        headers['x-cg-demo-api-key'] = this.apiKey
      }

      const response = await axios.get(`${this.baseUrl}/coins/${coinId}`, {
        headers,
        timeout: config.collectors.coinGecko.timeout,
      })

      return response.data
    } catch (error) {
      console.error('CoinGecko coin details error:', error)
      return null
    }
  }

  // 获取全球市场数据
  async fetchGlobalData(): Promise<any> {
    try {
      const headers: any = {}
      if (this.apiKey) {
        headers['x-cg-demo-api-key'] = this.apiKey
      }

      const response = await axios.get(`${this.baseUrl}/global`, {
        headers,
        timeout: config.collectors.coinGecko.timeout,
      })

      return response.data
    } catch (error) {
      console.error('CoinGecko global data error:', error)
      return null
    }
  }

  // 获取趋势币种
  async fetchTrending(): Promise<any> {
    try {
      const headers: any = {}
      if (this.apiKey) {
        headers['x-cg-demo-api-key'] = this.apiKey
      }

      const response = await axios.get(`${this.baseUrl}/search/trending`, {
        headers,
        timeout: config.collectors.coinGecko.timeout,
      })

      return response.data
    } catch (error) {
      console.error('CoinGecko trending error:', error)
      return null
    }
  }

  // 格式化加密货币数据为新闻格式
  formatCryptoAsNews(cryptos: CryptoData[]): CryptoNews {
    const topCryptos = cryptos.slice(0, 5)
    const summary = topCryptos
      .map(
        (c) =>
          `${c.name} (${c.symbol.toUpperCase()}): $${c.current_price.toLocaleString()} (${c.price_change_percentage_24h > 0 ? '+' : ''}${c.price_change_percentage_24h.toFixed(2)}%)`
      )
      .join(' | ')

    return {
      title: '加密货币市场快报',
      description: summary,
      url: 'https://www.coingecko.com',
      source: 'CoinGecko',
      publishedAt: new Date(),
      category: 'crypto',
    }
  }
}
