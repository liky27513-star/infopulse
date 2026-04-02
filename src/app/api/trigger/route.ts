import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'
import { config } from '@/lib/config'
import { scheduler } from '@/lib/scheduler'

// 手动触发推送（用于测试）
export async function POST(request: NextRequest) {
  try {
    // 验证管理员密钥
    const body = await request.json()
    const { secretKey, type = 'digest', email } = body

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
    } else if (type === 'test-email') {
      const recipient = email || config.defaultRecipient
      const success = await sendEmail({
        to: recipient,
        subject: `📡 InfoPulse 测试邮件 - ${new Date().toLocaleString('zh-CN', { timeZone: config.timeZone })}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 680px; margin: 0 auto; padding: 24px;">
            <h1 style="color: #0c4a6e; margin-bottom: 16px;">📡 InfoPulse 测试邮件</h1>
            <p style="font-size: 16px; line-height: 1.8; color: #334155;">
              这是一封来自线上环境的测试邮件，用于验证 SMTP 与投递流程是否正常。
            </p>
            <p style="font-size: 14px; color: #64748b;">
              发送时间：${new Date().toLocaleString('zh-CN', { timeZone: config.timeZone })}
            </p>
            <p style="font-size: 14px; color: #64748b;">
              站点地址：<a href="${config.siteUrl}">${config.siteUrl}</a>
            </p>
          </div>
        `,
      })

      return NextResponse.json({
        success,
        message: success ? `Test email sent to ${recipient}` : `Failed to send test email to ${recipient}`,
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
