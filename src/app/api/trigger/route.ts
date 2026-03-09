import { NextRequest, NextResponse } from 'next/server'
import { scheduler } from '@/lib/scheduler'

// 手动触发推送（用于测试）
export async function POST(request: NextRequest) {
  try {
    // 验证管理员密钥
    const body = await request.json()
    const { secretKey, type = 'digest' } = body

    if (secretKey !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (type === 'digest') {
      await scheduler.triggerManualDigest()
      return NextResponse.json({
        success: true,
        message: 'Digest triggered successfully',
      })
    } else if (type === 'breaking') {
      await scheduler.monitorBreakingNews()
      return NextResponse.json({
        success: true,
        message: 'Breaking news monitoring completed',
      })
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }
  } catch (error) {
    console.error('Manual trigger error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    )
  }
}
