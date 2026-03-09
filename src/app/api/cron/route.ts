import { NextRequest, NextResponse } from 'next/server'
import { scheduler } from '@/lib/scheduler'

// Vercel Cron Jobs 端点
export async function GET(request: NextRequest) {
  // 验证请求来源（Vercel Cron Jobs会自动添加认证头）
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 获取当前时间
    const now = new Date()
    const hour = now.getHours()

    // 根据时间决定执行哪个任务
    if (hour === 9 || hour === 15 || hour === 21 || hour === 3) {
      await scheduler.triggerManualDigest()
      return NextResponse.json({ message: 'Scheduled digest triggered' })
    } else {
      // 其他时间执行突发新闻监控
      await scheduler.monitorBreakingNews()
      return NextResponse.json({ message: 'Breaking news monitoring completed' })
    }
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
