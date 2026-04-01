import { NextRequest, NextResponse } from 'next/server'
import { config } from './config'
import { scheduler } from './scheduler'

export type CronTaskType = 'digest' | 'breaking'

export function isAuthorizedCronRequest(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.warn('CRON_SECRET is not configured')
    return false
  }

  return request.headers.get('authorization') === `Bearer ${cronSecret}`
}

export function unauthorizedCronResponse() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

export function getCurrentSchedulerTime(date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: config.scheduler.timezone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })

  const parts = formatter.formatToParts(date)
  const hour = Number(parts.find((part) => part.type === 'hour')?.value || '0')
  const minute = Number(parts.find((part) => part.type === 'minute')?.value || '0')

  return { hour, minute }
}

export function shouldRunDigestNow(date = new Date()) {
  const { hour, minute } = getCurrentSchedulerTime(date)
  return minute === 0 && config.scheduler.digestHours.includes(hour)
}

export async function runCronTask(task: CronTaskType) {
  try {
    if (task === 'digest') {
      await scheduler.triggerManualDigest()
      return NextResponse.json({ success: true, message: 'Scheduled digest triggered' })
    }

    await scheduler.monitorBreakingNews()
    return NextResponse.json({ success: true, message: 'Breaking news monitoring completed' })
  } catch (error) {
    console.error(`Cron job error (${task}):`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
