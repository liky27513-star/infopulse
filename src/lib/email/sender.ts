import nodemailer from 'nodemailer'
import { config } from '../config'

// 创建邮件传输器
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.qq.com',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: true, // 使用SSL
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS, // QQ邮箱授权码
    },
    tls: {
      rejectUnauthorized: true,
    },
  })
}

export interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
}

// 发送邮件
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const transporter = createTransporter()

  try {
    await transporter.sendMail({
      from: `"${config.email.fromName}" <${config.email.from}>`,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    })

    console.log(`Email sent successfully to ${options.to}`)
    return true
  } catch (error) {
    console.error('Email send error:', error)
    return false
  }
}

// 批量发送邮件
export async function sendBulkEmails(
  recipients: string[],
  subject: string,
  html: string
): Promise<{ success: number; failed: number }> {
  let success = 0
  let failed = 0

  // 分批发送，每批10个
  const batchSize = 10
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize)

    const promises = batch.map(async (recipient) => {
      const result = await sendEmail({
        to: recipient,
        subject,
        html,
      })
      return result
    })

    const results = await Promise.all(promises)
    success += results.filter((r) => r).length
    failed += results.filter((r) => !r).length

    // 批次间延迟，避免触发速率限制
    if (i + batchSize < recipients.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }

  console.log(`Bulk email sent: ${success} success, ${failed} failed`)
  return { success, failed }
}

// 测试邮件配置
export async function testEmailConnection(): Promise<boolean> {
  const transporter = createTransporter()

  try {
    await transporter.verify()
    console.log('Email server is ready to send messages')
    return true
  } catch (error) {
    console.error('Email connection test failed:', error)
    return false
  }
}
