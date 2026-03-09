import axios from 'axios'
import { config, Category } from '../config'

export interface StockData {
  symbol: string
  price: number
  change: number
  changePercent: number
  volume: number
  latestTradingDay: string
}

export interface EconomicIndicator {
  name: string
  value: number
  change?: number
  date: string
}

export class AlphaVantageCollector {
  private apiKey: string
  private baseUrl: string

  constructor() {
    this.apiKey = process.env.ALPHA_VANTAGE_API_KEY || ''
    this.baseUrl = config.collectors.alphaVantage.baseUrl
  }

  // 获取股票报价
  async fetchQuote(symbol: string): Promise<StockData | null> {
    if (!this.apiKey) {
      console.warn('Alpha Vantage API key not configured, skipping...')
      return null
    }

    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol: symbol,
          apikey: this.apiKey,
        },
        timeout: config.collectors.alphaVantage.timeout,
      })

      const data = response.data['Global Quote']
      if (!data) return null

      return {
        symbol: data['01. symbol'],
        price: parseFloat(data['05. price']),
        change: parseFloat(data['09. change']),
        changePercent: parseFloat(data['10. change percent'].replace('%', '')),
        volume: parseInt(data['06. volume']),
        latestTradingDay: data['07. latest trading day'],
      }
    } catch (error) {
      console.error('Alpha Vantage quote error:', error)
      return null
    }
  }

  // 获取经济指标
  async fetchEconomicIndicator(indicator: string): Promise<EconomicIndicator | null> {
    if (!this.apiKey) {
      return null
    }

    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          function: indicator,
          apikey: this.apiKey,
        },
        timeout: config.collectors.alphaVantage.timeout,
      })

      const data = response.data
      if (!data || data.Note) return null

      const latestData = Object.entries(data.data || {})[0]
      if (!latestData) return null

      return {
        name: indicator,
        value: parseFloat(latestData[1] as string),
        date: latestData[0] as string,
      }
    } catch (error) {
      console.error('Alpha Vantage economic indicator error:', error)
      return null
    }
  }

  // 获取主要股指
  async fetchMajorIndices(): Promise<StockData[]> {
    const symbols = ['SPY', 'QQQ', 'DIA'] // S&P 500, NASDAQ, Dow Jones
    const stocks: StockData[] = []

    for (const symbol of symbols) {
      const stock = await this.fetchQuote(symbol)
      if (stock) {
        stocks.push(stock)
      }
      // Alpha Vantage有速率限制，需要延迟
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    return stocks
  }

  // 格式化股票数据为新闻格式
  formatStocksAsNews(stocks: StockData[]): any {
    const summary = stocks
      .map((s) => `${s.symbol}: $${s.price.toFixed(2)} (${s.changePercent > 0 ? '+' : ''}${s.changePercent.toFixed(2)}%)`)
      .join(' | ')

    return {
      title: '美股市场快报',
      description: summary,
      url: 'https://www.google.com/finance',
      source: 'Alpha Vantage',
      publishedAt: new Date(),
      category: 'economy' as Category,
    }
  }
}
