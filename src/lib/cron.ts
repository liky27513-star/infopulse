import { NextRequest, NextResponse } from 'next/server'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import { config } from './config'
import { scheduler } from './scheduler'

export type CronTaskType = 'digest' | 'breaking'

const githubActionsIssuer = 'https://token.actions.githubusercontent.com'
const githubActionsAudience = 'infopulse-cron'
const githubRepo = 'liky27513-star/infopulse'
const githubMainRef = 'refs/heads/main'
const githubActionsJwks = createRemoteJWKSet(new URL(`${githubActionsIssuer}/.well-known/jwks`))

async function isAuthorizedGitHubActionsToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, githubActionsJwks, {
      issuer: githubActionsIssuer,
      audience: githubActionsAudience,
    })

    return payload.repository === githubRepo && payload.ref === githubMainRef
  } catch (error) {
    console.warn('GitHub Actions OIDC auth failed:', error)
    return false
  }
}

export async function isAuthorizedCronRequest(request: NextRequest): Promise<boolean> {
  const cronSecret = process.env.CRON_SECRET
  const authorization = request.headers.get('authorization')

  if (cronSecret && authorization === `Bearer ${cronSecret}`) {
    return true
  }

  if (authorization?.startsWith('Bearer ')) {
    return isAuthorizedGitHubActionsToken(authorization.slice('Bearer '.length))
  }

  if (!cronSecret) {
    console.warn('CRON_SECRET is not configured and no GitHub OIDC token was provided')
  }

  return false
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
