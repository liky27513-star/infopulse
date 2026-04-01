import { NewsAPICollector, NewsArticle } from './news-api'
import { CoinGeckoCollector, CryptoData } from './crypto'
import { PolymarketCollector, PolymarketMarket } from './polymarket'
import { RSSCollector, RSSArticle } from './rss'
import { AlphaVantageCollector, StockData } from './alpha-vantage'
import { CrossrefCollector, JournalArticle } from './crossref'
import { TwitterMonitor, MONITORED_ACCOUNTS } from './twitter'
import { Category, SourceType } from '../config'

export interface CollectedData {
  news: NewsArticle[]
  crypto: CryptoData[]
  polymarket: PolymarketMarket[]
  rss: RSSArticle[]
  stocks: StockData[]
  twitter: EditorialArticle[]
  journals: JournalArticle[]
}

export type CollectionMode = 'digest' | 'breaking'

export interface EditorialArticle {
  title: string
  description: string
  url: string
  source: string
  publishedAt: Date
  category: Category
  sourceType: SourceType
}

export interface EditorialFeedOptions {
  mode?: CollectionMode
  since?: Date
  maxArticles?: number
}

export class DataCollector {
  private newsAPI: NewsAPICollector
  private coinGecko: CoinGeckoCollector
  private polymarket: PolymarketCollector
  private rss: RSSCollector
  private alphaVantage: AlphaVantageCollector
  private twitter: TwitterMonitor
  private crossref: CrossrefCollector

  constructor() {
    this.newsAPI = new NewsAPICollector()
    this.coinGecko = new CoinGeckoCollector()
    this.polymarket = new PolymarketCollector()
    this.rss = new RSSCollector()
    this.alphaVantage = new AlphaVantageCollector()
    this.twitter = new TwitterMonitor()
    this.crossref = new CrossrefCollector()
  }

  async collectAll(): Promise<CollectedData> {
    console.log('Starting data collection...')

    const [news, crypto, polymarket, rss, stocks, twitter, journals] = await Promise.all([
      this.collectNews(),
      this.collectCrypto(),
      this.collectPolymarket(),
      this.collectRSS(),
      this.collectStocks(),
      this.collectTwitter(),
      this.collectJournals(),
    ])

    console.log('Data collection completed')
    console.log(`- News: ${news.length} articles`)
    console.log(`- Crypto: ${crypto.length} coins`)
    console.log(`- Polymarket: ${polymarket.length} markets`)
    console.log(`- RSS: ${rss.length} articles`)
    console.log(`- Stocks: ${stocks.length} indices`)
    console.log(`- Twitter: ${twitter.length} tweets`)
    console.log(`- Journals: ${journals.length} works`)

    return { news, crypto, polymarket, rss, stocks, twitter, journals }
  }

  async collectEditorialFeed(options: EditorialFeedOptions = {}): Promise<EditorialArticle[]> {
    const { mode = 'digest', since, maxArticles } = options

    console.log(`Starting editorial feed collection (${mode})...`)

    const [news, rss, journals, social] = await Promise.all([
      this.collectNews({ mode, since }),
      this.collectRSS({ since }),
      this.collectJournals({ since }),
      this.collectTwitter({ hoursAgo: mode === 'breaking' ? 4 : 18 }),
    ])

    const merged = this.deduplicateEditorialArticles([...news, ...rss, ...journals, ...social]).sort(
      (a, b) => b.publishedAt.getTime() - a.publishedAt.getTime()
    )

    const limited = typeof maxArticles === 'number' ? merged.slice(0, maxArticles) : merged

    console.log(`Editorial feed collection completed (${mode}): ${limited.length} articles`)
    return limited
  }

  private async collectNews(options: { mode?: CollectionMode; since?: Date } = {}): Promise<NewsArticle[]> {
    const { mode = 'digest', since } = options
    const articles: NewsArticle[] = []

    try {
      if (mode === 'breaking') {
        const breakingNews = await this.newsAPI.fetchBreakingWatchlist(since)
        articles.push(...breakingNews)
      } else {
        const [ai, tech, science, water, politics, economy, crypto, headlines] = await Promise.all([
          this.newsAPI.fetchAINews(since),
          this.newsAPI.fetchTechNews(since),
          this.newsAPI.fetchScienceNews(since),
          this.newsAPI.fetchWaterNews(since),
          this.newsAPI.fetchPoliticsNews(since),
          this.newsAPI.fetchEconomyNews(since),
          this.newsAPI.fetchCryptoNews(since),
          this.newsAPI.fetchHeadlineMix(),
        ])

        articles.push(...ai, ...tech, ...science, ...water, ...politics, ...economy, ...crypto, ...headlines)
      }
    } catch (error) {
      console.error('News collection error:', error)
    }

    return this.deduplicateEditorialArticles(articles)
  }

  private async collectCrypto(): Promise<CryptoData[]> {
    try {
      return await this.coinGecko.fetchTopCryptos()
    } catch (error) {
      console.error('Crypto collection error:', error)
      return []
    }
  }

  private async collectPolymarket(): Promise<PolymarketMarket[]> {
    try {
      const markets = await this.polymarket.fetchMarkets()
      return markets.filter((m) => parseFloat(m.volume) > 10000)
    } catch (error) {
      console.error('Polymarket collection error:', error)
      return []
    }
  }

  private async collectRSS(options: { since?: Date } = {}): Promise<RSSArticle[]> {
    try {
      return await this.rss.fetchAllFeeds(options.since)
    } catch (error) {
      console.error('RSS collection error:', error)
      return []
    }
  }

  private async collectJournals(options: { since?: Date } = {}): Promise<JournalArticle[]> {
    try {
      return await this.crossref.fetchConfiguredJournals(options.since)
    } catch (error) {
      console.error('Journal collection error:', error)
      return []
    }
  }

  private async collectStocks(): Promise<StockData[]> {
    try {
      return await this.alphaVantage.fetchMajorIndices()
    } catch (error) {
      console.error('Stocks collection error:', error)
      return []
    }
  }

  private async collectTwitter(options: { hoursAgo?: number } = {}): Promise<EditorialArticle[]> {
    try {
      const users = [
        ...MONITORED_ACCOUNTS.ai.map((a) => ({ username: a.username, category: 'ai' as const })),
        ...MONITORED_ACCOUNTS.crypto.map((a) => ({ username: a.username, category: 'crypto' as const })),
        ...MONITORED_ACCOUNTS.politics.map((a) => ({ username: a.username, category: 'politics' as const })),
        ...MONITORED_ACCOUNTS.economy.map((a) => ({ username: a.username, category: 'economy' as const })),
        ...MONITORED_ACCOUNTS.tech.map((a) => ({ username: a.username, category: 'tech' as const })),
      ]

      const tweets = await this.twitter.fetchMultipleUsers(users)
      const recentTweets = this.twitter.filterRecentTweets(tweets, options.hoursAgo ?? 6)

      return recentTweets.map((tweet) => ({
        title: `${tweet.author}: ${tweet.title}`,
        description: tweet.content,
        url: tweet.url,
        source: `X / @${tweet.authorHandle}`,
        publishedAt: tweet.publishedAt,
        category: tweet.category,
        sourceType: tweet.sourceType,
      }))
    } catch (error) {
      console.error('Twitter collection error:', error)
      return []
    }
  }

  async collectAI(): Promise<{ news: NewsArticle[]; rss: RSSArticle[]; journals: JournalArticle[] }> {
    const [news, rss, journals] = await Promise.all([
      this.newsAPI.fetchAINews(),
      this.rss.fetchAIRSS(),
      this.crossref.fetchConfiguredJournals().then((items) => items.filter((item) => item.category === 'ai')),
    ])

    return { news, rss, journals }
  }

  async collectCryptoOnly(): Promise<{ crypto: CryptoData[]; news: NewsArticle[] }> {
    const [crypto, news] = await Promise.all([this.coinGecko.fetchTopCryptos(), this.newsAPI.fetchCryptoNews()])

    return { crypto, news }
  }

  private deduplicateEditorialArticles<T extends { url: string }>(articles: T[]): T[] {
    const seen = new Map<string, T>()

    for (const article of articles) {
      if (!article.url || seen.has(article.url)) {
        continue
      }

      seen.set(article.url, article)
    }

    return Array.from(seen.values())
  }
}

export { NewsAPICollector, CoinGeckoCollector, PolymarketCollector, RSSCollector, AlphaVantageCollector, TwitterMonitor, CrossrefCollector }
