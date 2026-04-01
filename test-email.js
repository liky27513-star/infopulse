// 测试邮件发送脚本
const nodemailer = require('nodemailer')

delete process.env.HTTP_PROXY
delete process.env.HTTPS_PROXY
delete process.env.http_proxy
delete process.env.https_proxy

async function testEmail() {
  const host = process.env.SMTP_HOST || 'smtp.qq.com'
  const port = Number(process.env.SMTP_PORT || 465)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const to = process.env.TEST_EMAIL_TO || user

  console.log('开始测试邮件发送...')
  console.log('SMTP配置:', { host, port, user, to })

  if (!user || !pass) {
    throw new Error('请先配置 SMTP_USER 和 SMTP_PASS 环境变量')
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: true,
    auth: { user, pass },
  })

  try {
    console.log('验证SMTP连接...')
    await transporter.verify()
    console.log('SMTP连接成功!')

    console.log('发送测试邮件...')
    const info = await transporter.sendMail({
      from: `"InfoPulse 智能情报简报" <${user}>`,
      to,
      subject: '📡 InfoPulse 测试邮件 - ' + new Date().toLocaleString('zh-CN'),
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb;">📡 InfoPulse 测试邮件</h1>
          <p>这是一封测试邮件，用于验证邮件发送功能是否正常工作。</p>
          <p>发送时间: ${new Date().toLocaleString('zh-CN')}</p>
          <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 14px;">InfoPulse - 多源情报聚合系统</p>
        </div>
      `,
    })

    console.log('邮件发送成功!')
    console.log('Message ID:', info.messageId)
  } catch (error) {
    console.error('邮件发送失败:', error)
  }
}

testEmail()
