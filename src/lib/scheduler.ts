import cron from 'node-cron'
import { DataCollector } from './collectors'
import { processArticles, deduplicateArticles, sortByImportance, filterBreakingNews } from './ai'
import { sendBulkEmails, DigestEmail, BreakingNewsEmail } from './email'
import { prisma } from './db'
import { config } from './config'
import { render } from '@react-email/components'

// 主调度器类
export class Scheduler {
  private collector: DataCollector
  private isRunning: boolean = false

  constructor() {
    this.collector = new DataCollector()
  }

  // 启动定时任务
  start() {
    console.log('Starting scheduler...')

    // 定时推送任务：每天 09:00, 15:00, 21:00, 03:00 (北京时间)
    const scheduledTimes = [
      '0 9 * * *', // 09:00
      '0 15 * * *', // 15:00
      '0 21 * * *', // 21:00
      '0 3 * * *', // 03:00
    ]

    scheduledTimes.forEach((time) => {
      cron.schedule(time, () => this.runScheduledDigest(), {
        timezone: 'Asia/Shanghai',
      })
    })

    // 突发新闻监控：每30分钟检查一次
    cron.schedule('*/30 * * * *', () => this.monitorBreakingNews(), {
      timezone: 'Asia/Shanghai',
    })

    console.log('Scheduler started successfully')
  }

  // 执行定时摘要推送
  async runScheduledDigest() {
    if (this.isRunning) {
      console.log('Another task is running, skipping...')
      return
    }

    this.isRunning = true
    console.log('Starting scheduled digest...')

    try {
      // 1. 采集数据
      const data = await this.collector.collectAll()

      // 2. 合并所有新闻源
      const allArticles = [...data.news, ...data.rss]

      // 3. AI处理
      const processed = await processArticles(allArticles)

      // 4. 去重和排序
      const deduplicated = deduplicateArticles(processed)
      const sorted = sortByImportance(deduplicated)

      // 5. 获取活跃订阅者
      const subscribers = await prisma.subscriber.findMany({
        where: { isActive: true },
      })

      if (subscribers.length === 0) {
        console.log('No active subscribers, skipping email send')
        return
      }

      // 6. 生成邮件内容
      const digestTime = new Date().toLocaleString('zh-CN', {
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })

      const emailHtml = render(
        DigestEmail({
          articles: sorted.slice(0, 30), // 只发送前30条
          digestTime,
          siteUrl: config.siteUrl,
        })
      )

      // 7. 发送邮件
      const recipients = subscribers.map((s) => s.email)
      const result = await sendBulkEmails(recipients, `📡 InfoPulse 智能简报 - ${digestTime}`, emailHtml)

      // 8. 保存到数据库
      const digest = await prisma.digest.create({
        data: {
          sentAt: new Date(),
          type: 'scheduled',
          recipientCount: result.success,
        },
      })

      // 保存新闻项
      for (const article of sorted.slice(0, 30)) {
        await prisma.newsItem.create({
          data: {
            title: article.title,
            summary: article.summary,
            category: article.category,
            importance: article.importance,
            source: article.source,
            sourceUrl: article.sourceUrl,
            isBreaking: article.isBreaking,
            publishedAt: article.publishedAt,
            digestId: digest.id,
          },
        })
      }

      console.log(`Scheduled digest completed: ${result.success} emails sent`)
    } catch (error) {
      console.error('Scheduled digest error:', error)
    } finally {
      this.isRunning = false
    }
  }

  // 监控突发新闻
  async monitorBreakingNews() {
    console.log('Monitoring breaking news...')

    try {
      // 1. 采集最新数据
      const data = await this.collector.collectAll()

      // 2. 合并新闻源
      const allArticles = [...data.news, ...data.rss]

      // 3. AI处理
      const processed = await processArticles(allArticles)

      // 4. 过滤突发事件
      const breaking = filterBreakingNews(processed)

      if (breaking.length === 0) {
        console.log('No breaking news detected')
        return
      }

      // 5. 检查是否已发送
      const unsentBreaking: typeof breaking = []
      for (const article of breaking) {
        const exists = await prisma.newsItem.findFirst({
          where: {
            sourceUrl: article.sourceUrl,
            isBreaking: true,
          },
        })
        if (!exists) {
          unsentBreaking.push(article)
        }
      }

      if (unsentBreaking.length === 0) {
        console.log('All breaking news already sent')
        return
      }

      // 6. 发送突发新闻通知
      const subscribers = await prisma.subscriber.findMany({
        where: { isActive: true },
      })

      const recipients = subscribers.map((s) => s.email)

      for (const article of unsentBreaking) {
        const emailHtml = render(
          BreakingNewsEmail({
            article,
            siteUrl: config.siteUrl,
          })
        )

        await sendBulkEmails(recipients, `⚡ 突发新闻: ${article.title}`, emailHtml)

        // 保存到数据库
        await prisma.newsItem.create({
          data: {
            title: article.title,
            summary: article.summary,
            category: article.category,
            importance: article.importance,
            source: article.source,
            sourceUrl: article.sourceUrl,
            isBreaking: true,
            publishedAt: article.publishedAt,
          },
        })

        console.log(`Breaking news sent: ${article.title}`)
      }
    } catch (error) {
      console.error('Breaking news monitoring error:', error)
    }
  }

  // 手动触发（用于测试）
  async triggerManualDigest() {
    console.log('Manual digest triggered')
    await this.runScheduledDigest()
  }
}

// 创建全局调度器实例
export const scheduler = new Scheduler()
