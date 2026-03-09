import { NewsAPICollector, NewsArticle } from './news-api'
import { CoinGeckoCollector, CryptoData } from './crypto'
import { PolymarketCollector, PolymarketMarket } from './polymarket'
import { RSSCollector, RSSArticle } from './rss'
import { AlphaVantageCollector, StockData } from './alpha-vantage'
import { TwitterMonitor, TwitterTweet, MONITORED_ACCOUNTS } from './twitter'

export interface CollectedData {
  news: NewsArticle[]
  crypto: CryptoData[]
  polymarket: PolymarketMarket[]
  rss: RSSArticle[]
  stocks: StockData[]
  twitter: TwitterTweet[]
}

export class DataCollector {
  private newsAPI: NewsAPICollector
  private coinGecko: CoinGeckoCollector
  private polymarket: PolymarketCollector
  private rss: RSSCollector
  private alphaVantage: AlphaVantageCollector
  private twitter: TwitterMonitor

  constructor() {
    this.newsAPI = new NewsAPICollector()
    this.coinGecko = new CoinGeckoCollector()
    this.polymarket = new PolymarketCollector()
    this.rss = new RSSCollector()
    this.alphaVantage = new AlphaVantageCollector()
    this.twitter = new TwitterMonitor()
  }

  // 并行采集所有数据
  async collectAll(): Promise<CollectedData> {
    console.log('Starting data collection...')

    const [news, crypto, polymarket, rss, stocks, twitter] = await Promise.all([
      this.collectNews(),
      this.collectCrypto(),
      this.collectPolymarket(),
      this.collectRSS(),
      this.collectStocks(),
      this.collectTwitter(),
    ])

    console.log('Data collection completed')
    console.log(`- News: ${news.length} articles`)
    console.log(`- Crypto: ${crypto.length} coins`)
    console.log(`- Polymarket: ${polymarket.length} markets`)
    console.log(`- RSS: ${rss.length} articles`)
    console.log(`- Stocks: ${stocks.length} indices`)
    console.log(`- Twitter: ${twitter.length} tweets`)

    return { news, crypto, polymarket, rss, stocks, twitter }
  }

  // 采集新闻
  private async collectNews(): Promise<NewsArticle[]> {
    const articles: NewsArticle[] = []

    try {
      // 并行获取各类新闻
      const [ai, tech, politics, economy, crypto] = await Promise.all([
        this.newsAPI.fetchAINews(),
        this.newsAPI.fetchTopHeadlines('technology'),
        this.newsAPI.fetchPoliticsNews(),
        this.newsAPI.fetchEconomyNews(),
        this.newsAPI.fetchCryptoNews(),
      ])

      articles.push(...ai, ...tech, ...politics, ...economy, ...crypto)
    } catch (error) {
      console.error('News collection error:', error)
    }

    return articles
  }

  // 采集加密货币数据
  private async collectCrypto(): Promise<CryptoData[]> {
    try {
      return await this.coinGecko.fetchTopCryptos()
    } catch (error) {
      console.error('Crypto collection error:', error)
      return []
    }
  }

  // 采集Polymarket数据
  private async collectPolymarket(): Promise<PolymarketMarket[]> {
    try {
      const markets = await this.polymarket.fetchMarkets()
      return markets.filter((m) => parseFloat(m.volume) > 10000) // 只保留交易量大于1万的市场
    } catch (error) {
      console.error('Polymarket collection error:', error)
      return []
    }
  }

  // 采集RSS文章
  private async collectRSS(): Promise<RSSArticle[]> {
    try {
      return await this.rss.fetchAllFeeds()
    } catch (error) {
      console.error('RSS collection error:', error)
      return []
    }
  }

  // 采集股票数据
  private async collectStocks(): Promise<StockData[]> {
    try {
      return await this.alphaVantage.fetchMajorIndices()
    } catch (error) {
      console.error('Stocks collection error:', error)
      return []
    }
  }

  // 采集Twitter数据
  private async collectTwitter(): Promise<TwitterTweet[]> {
    try {
      // 构建监控账号列表
      const users = [
        ...MONITORED_ACCOUNTS.ai.map((a) => ({ username: a.username, category: 'ai' as const })),
        ...MONITORED_ACCOUNTS.crypto.map((a) => ({ username: a.username, category: 'crypto' as const })),
        ...MONITORED_ACCOUNTS.politics.map((a) => ({ username: a.username, category: 'politics' as const })),
        ...MONITORED_ACCOUNTS.economy.map((a) => ({ username: a.username, category: 'economy' as const })),
        ...MONITORED_ACCOUNTS.tech.map((a) => ({ username: a.username, category: 'tech' as const })),
      ]

      const tweets = await this.twitter.fetchMultipleUsers(users)

      // 只保留最近6小时的推文
      const recentTweets = this.twitter.filterRecentTweets(tweets, 6)

      return recentTweets
    } catch (error) {
      console.error('Twitter collection error:', error)
      return []
    }
  }

  // 仅采集AI相关数据
  async collectAI(): Promise<{ news: NewsArticle[]; rss: RSSArticle[]; polymarket: PolymarketMarket[] }> {
    const [news, rss, polymarket] = await Promise.all([
      this.newsAPI.fetchAINews(),
      this.rss.fetchAIRSS(),
      this.polymarket.fetchAIMarkets(),
    ])

    return { news, rss, polymarket }
  }

  // 仅采集加密货币数据
  async collectCryptoOnly(): Promise<{ crypto: CryptoData[]; news: NewsArticle[] }> {
    const [crypto, news] = await Promise.all([this.coinGecko.fetchTopCryptos(), this.newsAPI.fetchCryptoNews()])

    return { crypto, news }
  }
}

// 导出所有采集器
export { NewsAPICollector, CoinGeckoCollector, PolymarketCollector, RSSCollector, AlphaVantageCollector, TwitterMonitor }
