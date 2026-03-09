import axios from 'axios'
import { config, Category } from '../config'

export interface PolymarketMarket {
  id: string
  question: string
  description: string
  outcomePrices: string[]
  outcomes: string[]
  volume: string
  active: boolean
  closed: boolean
  image: string
  icon: string
  endDate: string
  category: string
}

export interface PolymarketEvent {
  id: string
  title: string
  slug: string
  description: string
  markets: PolymarketMarket[]
  active: boolean
  closed: boolean
  image: string
  icon: string
  tags: string[]
}

export class PolymarketCollector {
  private baseUrl: string

  constructor() {
    this.baseUrl = config.collectors.polymarket.baseUrl
  }

  // 获取热门事件
  async fetchEvents(limit: number = 20): Promise<PolymarketEvent[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/events`, {
        params: {
          _s: 'active',
          _l: limit,
        },
        timeout: config.collectors.polymarket.timeout,
      })

      return response.data
    } catch (error) {
      console.error('Polymarket events fetch error:', error)
      return []
    }
  }

  // 获取市场详情
  async fetchMarkets(eventId?: string): Promise<PolymarketMarket[]> {
    try {
      const params: any = {
        _s: 'active',
        _l: 50,
      }

      if (eventId) {
        params.event_id = eventId
      }

      const response = await axios.get(`${this.baseUrl}/markets`, {
        params,
        timeout: config.collectors.polymarket.timeout,
      })

      return response.data
    } catch (error) {
      console.error('Polymarket markets fetch error:', error)
      return []
    }
  }

  // 获取AI相关预测市场
  async fetchAIMarkets(): Promise<PolymarketMarket[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/markets`, {
        params: {
          _s: 'active',
          tag: 'AI',
          _l: 20,
        },
        timeout: config.collectors.polymarket.timeout,
      })

      return response.data
    } catch (error) {
      console.error('Polymarket AI markets fetch error:', error)
      return []
    }
  }

  // 获取政治相关预测市场
  async fetchPoliticsMarkets(): Promise<PolymarketMarket[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/markets`, {
        params: {
          _s: 'active',
          tag: 'Politics',
          _l: 20,
        },
        timeout: config.collectors.polymarket.timeout,
      })

      return response.data
    } catch (error) {
      console.error('Polymarket politics markets fetch error:', error)
      return []
    }
  }

  // 格式化市场数据
  formatMarketAsNews(market: PolymarketMarket): any {
    const probability = parseFloat(market.outcomePrices[0]) / 100
    const volume = parseFloat(market.volume)

    return {
      question: market.question,
      probability: probability,
      volume: volume,
      outcomes: market.outcomes,
      endDate: market.endDate,
      category: 'prediction' as Category,
    }
  }

  // 获取高交易量市场
  async fetchHighVolumeMarkets(minVolume: number = 100000): Promise<PolymarketMarket[]> {
    try {
      const markets = await this.fetchMarkets()
      return markets.filter((m) => parseFloat(m.volume) >= minVolume)
    } catch (error) {
      console.error('Polymarket high volume markets error:', error)
      return []
    }
  }
}
