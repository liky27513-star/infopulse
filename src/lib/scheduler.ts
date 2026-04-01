import cron, { ScheduledTask } from 'node-cron'
import { render } from '@react-email/components'
import { ProcessedArticle, deduplicateArticles, filterBreakingNews, generateDigestOverview, processArticles, sortByImportance } from './ai'
import { DataCollector, EditorialArticle } from './collectors'
import { prisma } from './db'
import { BreakingNewsEmail, DigestEmail, DigestEmailArticle, sendBulkEmails } from './email'
import { Category, SourceType, config } from './config'

const globalForScheduler = globalThis as unknown as {
  infopulseSchedulerStarted?: boolean
}

const subtractHours = (hours: number) => new Date(Date.now() - hours * 60 * 60 * 1000)

const clampSinceToConfiguredWindow = (since: Date): Date => {
  const maxLookback = subtractHours(config.collectors.newsApi.maxLookbackHours)
  return since < maxLookback ? maxLookback : since
}

type SavedNewsRecord = {
  id: string
  title: string
  summary: string
  detail: string
  category: string
  sourceType: string
  importance: number
  source: string
  sourceUrl: string
  isBreaking: boolean
  publishedAt: Date
}

export class Scheduler {
  private collector: DataCollector
  private isRunning = false
  private started = false
  private tasks: ScheduledTask[] = []

  constructor() {
    this.collector = new DataCollector()
  }

  start() {
    if (this.started) {
      console.log('Scheduler already started, skipping duplicate start')
      return
    }

    console.log(`Starting scheduler in ${config.scheduler.timezone}...`)

    this.tasks = [
      ...config.scheduler.digestCronExpressions.map((expression) =>
        cron.schedule(
          expression,
          () => {
            void this.runScheduledDigest()
          },
          {
            timezone: config.scheduler.timezone,
          }
        )
      ),
      cron.schedule(
        config.scheduler.breakingCronExpression,
        () => {
          void this.monitorBreakingNews()
        },
        {
          timezone: config.scheduler.timezone,
        }
      ),
    ]

    this.started = true
    console.log('Scheduler started successfully')
  }

  stop() {
    this.tasks.forEach((task) => task.stop())
    this.tasks = []
    this.started = false
    console.log('Scheduler stopped')
  }

  private async withLock(taskName: string, handler: () => Promise<void>) {
    if (this.isRunning) {
      console.log(`Another task is already running, skipping ${taskName}`)
      return
    }

    this.isRunning = true
    console.log(`Starting ${taskName}...`)

    try {
      await handler()
      console.log(`${taskName} completed`)
    } catch (error) {
      console.error(`${taskName} error:`, error)
    } finally {
      this.isRunning = false
    }
  }

  private async getActiveSubscribers() {
    return prisma.subscriber.findMany({
      where: { isActive: true },
    })
  }

  private async getDigestSince(): Promise<Date> {
    const fallbackSince = subtractHours(config.scheduler.digestFallbackLookbackHours)
    const lastDigest = await prisma.digest.findFirst({
      where: { type: 'scheduled' },
      orderBy: { sentAt: 'desc' },
      select: { sentAt: true },
    })

    if (!lastDigest) {
      return clampSinceToConfiguredWindow(fallbackSince)
    }

    const bufferedSince = new Date(lastDigest.sentAt.getTime() - config.scheduler.digestBufferMinutes * 60 * 1000)
    return clampSinceToConfiguredWindow(bufferedSince)
  }

  private getBreakingSince(): Date {
    return clampSinceToConfiguredWindow(subtractHours(config.scheduler.breakingLookbackHours))
  }

  private async collectDigestCandidates(): Promise<EditorialArticle[]> {
    const since = await this.getDigestSince()

    return this.collector.collectEditorialFeed({
      mode: 'digest',
      since,
      maxArticles: config.scheduler.maxDigestArticles,
    })
  }

  private async collectBreakingCandidates(): Promise<EditorialArticle[]> {
    return this.collector.collectEditorialFeed({
      mode: 'breaking',
      since: this.getBreakingSince(),
      maxArticles: config.scheduler.maxBreakingArticles,
    })
  }

  private async prepareArticles(rawArticles: EditorialArticle[]) {
    if (rawArticles.length === 0) {
      return []
    }

    const processed = await processArticles(rawArticles)
    const deduplicated = deduplicateArticles(processed)
    return sortByImportance(deduplicated)
  }

  private async saveScheduledArticles(
    digestId: string,
    articles: Awaited<ReturnType<Scheduler['prepareArticles']>>
  ): Promise<SavedNewsRecord[]> {
    const saved: SavedNewsRecord[] = []

    for (const article of articles) {
      const record = await prisma.newsItem.upsert({
        where: { sourceUrl: article.sourceUrl },
        create: {
          title: article.title,
          summary: article.summary,
          detail: article.detail,
          category: article.category,
          sourceType: article.sourceType,
          importance: article.importance,
          source: article.source,
          sourceUrl: article.sourceUrl,
          isBreaking: article.isBreaking,
          publishedAt: article.publishedAt,
          digestId,
        },
        update: {
          title: article.title,
          summary: article.summary,
          detail: article.detail,
          category: article.category,
          sourceType: article.sourceType,
          importance: article.importance,
          source: article.source,
          publishedAt: article.publishedAt,
          digestId,
          ...(article.isBreaking ? { isBreaking: true } : {}),
        },
        select: {
          id: true,
          title: true,
          summary: true,
          detail: true,
          category: true,
          sourceType: true,
          importance: true,
          source: true,
          sourceUrl: true,
          isBreaking: true,
          publishedAt: true,
        },
      })

      saved.push(record)
    }

    return saved
  }

  private toDigestEmailArticle(record: SavedNewsRecord): DigestEmailArticle {
    return {
      id: record.id,
      title: record.title,
      summary: record.summary,
      detailUrl: `${config.siteUrl}/news/${record.id}`,
      sourceUrl: record.sourceUrl,
      source: record.source,
      category: record.category as Category,
      sourceType: record.sourceType as SourceType,
      importance: record.importance,
      isBreaking: record.isBreaking,
      publishedAt: record.publishedAt,
    }
  }

  private async persistBreakingArticle(digestId: string, article: ProcessedArticle): Promise<SavedNewsRecord> {
    return prisma.newsItem.create({
      data: {
        title: article.title,
        summary: article.summary,
        detail: article.detail,
        category: article.category,
        sourceType: article.sourceType,
        importance: article.importance,
        source: article.source,
        sourceUrl: article.sourceUrl,
        isBreaking: true,
        publishedAt: article.publishedAt,
        digestId,
      },
      select: {
        id: true,
        title: true,
        summary: true,
        detail: true,
        category: true,
        sourceType: true,
        importance: true,
        source: true,
        sourceUrl: true,
        isBreaking: true,
        publishedAt: true,
      },
    })
  }

  async runScheduledDigest() {
    await this.withLock('scheduled digest', async () => {
      const subscribers = await this.getActiveSubscribers()

      if (subscribers.length === 0) {
        console.log('No active subscribers, skipping scheduled digest')
        return
      }

      const rawArticles = await this.collectDigestCandidates()
      const sorted = await this.prepareArticles(rawArticles)

      if (sorted.length === 0) {
        console.log('No fresh articles found for scheduled digest')
        return
      }

      const selectedArticles = sorted.slice(0, 30)
      const digestTime = new Date().toLocaleString('zh-CN', {
        timeZone: config.scheduler.timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })

      const overview = await generateDigestOverview(selectedArticles)

      const digest = await prisma.digest.create({
        data: {
          sentAt: new Date(),
          type: 'scheduled',
          overview,
          recipientCount: 0,
        },
      })

      const savedArticles = await this.saveScheduledArticles(digest.id, selectedArticles)
      const emailArticles = savedArticles.map((record) => this.toDigestEmailArticle(record))

      const emailHtml = await render(
        DigestEmail({
          overview,
          articles: emailArticles,
          digestTime,
          siteUrl: config.siteUrl,
        })
      )

      const recipients = subscribers.map((subscriber) => subscriber.email)
      const result = await sendBulkEmails(recipients, `📡 InfoPulse 今日情报 - ${digestTime}`, emailHtml)

      await prisma.digest.update({
        where: { id: digest.id },
        data: {
          recipientCount: result.success,
          overview,
        },
      })

      console.log(`Scheduled digest sent: ${result.success} success, ${result.failed} failed`)
    })
  }

  async monitorBreakingNews() {
    await this.withLock('breaking news monitor', async () => {
      const subscribers = await this.getActiveSubscribers()

      if (subscribers.length === 0) {
        console.log('No active subscribers, skipping breaking monitor')
        return
      }

      const rawArticles = await this.collectBreakingCandidates()
      const processed = await this.prepareArticles(rawArticles)
      const breaking = filterBreakingNews(processed)

      if (breaking.length === 0) {
        console.log('No breaking news detected')
        return
      }

      const unsentBreaking: typeof breaking = []

      for (const article of breaking) {
        const exists = await prisma.newsItem.findUnique({
          where: { sourceUrl: article.sourceUrl },
          select: { id: true },
        })

        if (!exists) {
          unsentBreaking.push(article)
        }
      }

      if (unsentBreaking.length === 0) {
        console.log('All breaking news already handled')
        return
      }

      const recipients = subscribers.map((subscriber) => subscriber.email)
      const breakingDigest = await prisma.digest.create({
        data: {
          sentAt: new Date(),
          type: 'breaking',
          recipientCount: 0,
          overview: `检测到 ${unsentBreaking.length} 条需要立即关注的重点事件。`,
        },
      })

      let success = 0
      let failed = 0

      for (const article of unsentBreaking) {
        const savedRecord = await this.persistBreakingArticle(breakingDigest.id, article)
        const emailArticle = this.toDigestEmailArticle(savedRecord)

        const emailHtml = await render(
          BreakingNewsEmail({
            article: {
              title: emailArticle.title,
              summary: emailArticle.summary,
              detailUrl: emailArticle.detailUrl,
              sourceUrl: emailArticle.sourceUrl,
              source: emailArticle.source,
              category: emailArticle.category,
              sourceType: emailArticle.sourceType,
              importance: emailArticle.importance,
              publishedAt: emailArticle.publishedAt,
            },
            siteUrl: config.siteUrl,
          })
        )

        const result = await sendBulkEmails(recipients, `⚡ 重点情报: ${article.title}`, emailHtml)
        success += result.success
        failed += result.failed

        console.log(`Breaking news sent: ${article.title}`)
      }

      await prisma.digest.update({
        where: { id: breakingDigest.id },
        data: {
          recipientCount: success,
        },
      })

      console.log(`Breaking digest sent: ${success} success, ${failed} failed`)
    })
  }

  async triggerManualDigest() {
    console.log('Manual digest triggered')
    await this.runScheduledDigest()
  }
}

export const scheduler = new Scheduler()

export function ensureSchedulerStarted() {
  if (!config.scheduler.enableLocalCron) {
    console.log('Local scheduler disabled; relying on external cron')
    return
  }

  if (globalForScheduler.infopulseSchedulerStarted) {
    return
  }

  scheduler.start()
  globalForScheduler.infopulseSchedulerStarted = true
}
