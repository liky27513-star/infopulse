import Parser from 'rss-parser'
import { Category, SourceType } from '../config'

export interface TwitterTweet {
  title: string
  content: string
  url: string
  author: string
  authorHandle: string
  publishedAt: Date
  category: Category
  sourceType: SourceType
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

    this.nitterInstances = [
      'https://nitter.net',
      'https://nitter.poast.org',
      'https://nitter.privacydev.net',
      'https://nitter.fdn.fr',
    ]
  }

  async fetchUserTweets(username: string, category: Category): Promise<TwitterTweet[]> {
    const tweets: TwitterTweet[] = []

    for (const instance of this.nitterInstances) {
      try {
        const feedUrl = `${instance}/${username}/rss`
        const feed = await this.parser.parseURL(feedUrl)

        for (const item of feed.items.slice(0, 10)) {
          const content = item.contentSnippet || item.summary || ''
          const title = item.title || ''

          if (title.startsWith('RT @') || title.startsWith('R to @')) {
            continue
          }

          tweets.push({
            title,
            content,
            url: item.link || `https://twitter.com/${username}`,
            author: item.creator || username,
            authorHandle: username,
            publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
            category,
            sourceType: 'social',
          })
        }

        break
      } catch (error) {
        console.error(`Failed to fetch from ${instance}/${username}:`, error)
        continue
      }
    }

    return tweets
  }

  async fetchMultipleUsers(
    users: Array<{ username: string; category: Category }>
  ): Promise<TwitterTweet[]> {
    const allTweets: TwitterTweet[] = []

    for (const user of users) {
      try {
        const tweets = await this.fetchUserTweets(user.username, user.category)
        allTweets.push(...tweets)
        await new Promise((resolve) => setTimeout(resolve, 500))
      } catch (error) {
        console.error(`Error fetching tweets for ${user.username}:`, error)
      }
    }

    return allTweets
  }

  filterRecentTweets(tweets: TwitterTweet[], hoursAgo: number = 6): TwitterTweet[] {
    const cutoff = new Date(Date.now() - hoursAgo * 60 * 60 * 1000)
    return tweets.filter((tweet) => tweet.publishedAt >= cutoff)
  }

  rankTweetsByKeywords(tweets: TwitterTweet[], keywords: string[]): TwitterTweet[] {
    return tweets.sort((a, b) => {
      const scoreA = this.calculateKeywordScore(a, keywords)
      const scoreB = this.calculateKeywordScore(b, keywords)
      return scoreB - scoreA
    })
  }

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

export const MONITORED_ACCOUNTS = {
  ai: [
    { username: 'OpenAI', name: 'OpenAI' },
    { username: 'AnthropicAI', name: 'Anthropic' },
    { username: 'GoogleDeepMind', name: 'Google DeepMind' },
    { username: 'AIatMeta', name: 'Meta AI' },
    { username: 'sama', name: 'Sam Altman' },
    { username: 'karpathy', name: 'Andrej Karpathy' },
    { username: 'ylecun', name: 'Yann LeCun' },
    { username: 'AndrewYNg', name: 'Andrew Ng' },
    { username: 'drfeifei', name: 'Fei-Fei Li' },
    { username: 'demishassabis', name: 'Demis Hassabis' },
    { username: 'ilyasut', name: 'Ilya Sutskever' },
    { username: 'Yoshua_Bengio', name: 'Yoshua Bengio' },
    { username: 'fchollet', name: 'Francois Chollet' },
  ],
  crypto: [
    { username: 'VitalikButerin', name: 'Vitalik Buterin' },
    { username: 'binance', name: 'Binance' },
    { username: 'coinbase', name: 'Coinbase' },
    { username: 'michael_saylor', name: 'Michael Saylor' },
    { username: 'APompliano', name: 'Anthony Pompliano' },
    { username: 'aantonop', name: 'Andreas Antonopoulos' },
  ],
  politics: [
    { username: 'WhiteHouse', name: 'The White House' },
    { username: 'POTUS', name: 'US President' },
    { username: 'SecBlinken', name: 'Secretary of State' },
  ],
  economy: [
    { username: 'federalreserve', name: 'Federal Reserve' },
    { username: 'SEC_News', name: 'SEC' },
    { username: 'USTreasury', name: 'US Treasury' },
    { username: 'IMFNews', name: 'IMF' },
  ],
  tech: [
    { username: 'satyanadella', name: 'Satya Nadella' },
    { username: 'tim_cook', name: 'Tim Cook' },
    { username: 'pichai', name: 'Sundar Pichai' },
    { username: 'NVIDIAAI', name: 'NVIDIA AI' },
  ],
}
