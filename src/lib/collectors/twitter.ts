import Parser from 'rss-parser'
import { Category } from '../config'

export interface TwitterTweet {
  title: string
  content: string
  url: string
  author: string
  authorHandle: string
  publishedAt: Date
  category: Category
}

export class TwitterMonitor {
  private parser: Parser
  private nitterInstances: string[]

  constructor() {
    this.parser = new Parser({
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; InfoPulse/1.0)',
      },
    })

    // 多个Nitter实例，提高可用性
    this.nitterInstances = [
      'https://nitter.net',
      'https://nitter.poast.org',
      'https://nitter.privacydev.net',
      'https://nitter.fdn.fr',
    ]
  }

  // 获取单个用户的推文
  async fetchUserTweets(username: string, category: Category): Promise<TwitterTweet[]> {
    const tweets: TwitterTweet[] = []

    // 尝试多个Nitter实例
    for (const instance of this.nitterInstances) {
      try {
        const feedUrl = `${instance}/${username}/rss`
        const feed = await this.parser.parseURL(feedUrl)

        for (const item of feed.items.slice(0, 10)) {
          // 解析推文内容
          const content = item.contentSnippet || item.summary || ''
          const title = item.title || ''

          // 跳过转发和回复（只保留原创推文）
          if (title.startsWith('RT @') || title.startsWith('R to @')) {
            continue
          }

          tweets.push({
            title: title,
            content: content,
            url: item.link || `https://twitter.com/${username}`,
            author: item.creator || username,
            authorHandle: username,
            publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
            category: category,
          })
        }

        // 成功获取，跳出循环
        break
      } catch (error) {
        console.error(`Failed to fetch from ${instance}/${username}:`, error)
        // 继续尝试下一个实例
        continue
      }
    }

    return tweets
  }

  // 批量获取多个用户的推文
  async fetchMultipleUsers(
    users: Array<{ username: string; category: Category }>
  ): Promise<TwitterTweet[]> {
    const allTweets: TwitterTweet[] = []

    for (const user of users) {
      try {
        const tweets = await this.fetchUserTweets(user.username, user.category)
        allTweets.push(...tweets)

        // 添加延迟，避免请求过快
        await new Promise((resolve) => setTimeout(resolve, 500))
      } catch (error) {
        console.error(`Error fetching tweets for ${user.username}:`, error)
      }
    }

    return allTweets
  }

  // 过滤最近N小时的推文
  filterRecentTweets(tweets: TwitterTweet[], hoursAgo: number = 6): TwitterTweet[] {
    const cutoff = new Date(Date.now() - hoursAgo * 60 * 60 * 1000)
    return tweets.filter((tweet) => tweet.publishedAt >= cutoff)
  }

  // 按重要性排序（基于关键词）
  rankTweetsByKeywords(tweets: TwitterTweet[], keywords: string[]): TwitterTweet[] {
    return tweets.sort((a, b) => {
      const scoreA = this.calculateKeywordScore(a, keywords)
      const scoreB = this.calculateKeywordScore(b, keywords)
      return scoreB - scoreA
    })
  }

  // 计算关键词匹配分数
  private calculateKeywordScore(tweet: TwitterTweet, keywords: string[]): number {
    const text = `${tweet.title} ${tweet.content}`.toLowerCase()
    let score = 0

    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        score += 1
      }
    }

    return score
  }
}

// 预定义的重要Twitter账号列表
export const MONITORED_ACCOUNTS = {
  ai: [
    { username: 'OpenAI', name: 'OpenAI' },
    { username: 'AnthropicAI', name: 'Anthropic' },
    { username: 'GoogleDeepMind', name: 'Google DeepMind' },
    { username: 'MetaAI', name: 'Meta AI' },
    { username: 'satofloyd', name: 'Satoshi (Crypto)' },
    { username: 'karpathy', name: 'Andrej Karpathy' },
    { username: 'ylecun', name: 'Yann LeCun' },
    { username: 'goodfellow_ian', name: 'Ian Goodfellow' },
  ],
  crypto: [
    { username: 'VitalikButerin', name: 'Vitalik Buterin' },
    { username: 'elonmusk', name: 'Elon Musk' },
    { username: 'binance', name: 'Binance' },
    { username: 'coinbase', name: 'Coinbase' },
    { username: 'michael_saylor', name: 'Michael Saylor' },
    { username: 'APompliano', name: 'Anthony Pompliano' },
    { username: 'aantonop', name: 'Andreas Antonopoulos' },
  ],
  politics: [
    { username: 'WhiteHouse', name: 'The White House' },
    { username: 'POTUS', name: 'President Biden' },
    { username: 'SecBlinken', name: 'Secretary Blinken' },
  ],
  economy: [
    { username: 'federalreserve', name: 'Federal Reserve' },
    { username: 'SEC_News', name: 'SEC' },
    { username: 'USTreasury', name: 'US Treasury' },
    { username: 'federalreserve', name: 'Federal Reserve' },
  ],
  tech: [
    { username: 'sama', name: 'Sam Altman' },
    { username: 'elonmusk', name: 'Elon Musk' },
    { username: 'satyanadella', name: 'Satya Nadella' },
    { username: 'tim_cook', name: 'Tim Cook' },
    { username: 'pichai', name: 'Sundar Pichai' },
  ],
}