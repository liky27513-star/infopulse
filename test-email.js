// 测试邮件发送脚本
const nodemailer = require('nodemailer')

// 清除代理环境变量
delete process.env.HTTP_PROXY
delete process.env.HTTPS_PROXY
delete process.env.http_proxy
delete process.env.https_proxy

async function testEmail() {
  console.log('开始测试邮件发送...')
  console.log('SMTP配置:', {
    host: 'smtp.qq.com',
    port: 465,
    user: '3421637305@qq.com',
  })

  const transporter = nodemailer.createTransport({
    host: 'smtp.qq.com',
    port: 465,
    secure: true,
    auth: {
      user: '3421637305@qq.com',
      pass: 'pvzunrqpbdgudbeh',
    },
  })

  try {
    // 验证连接
    console.log('验证SMTP连接...')
    await transporter.verify()
    console.log('SMTP连接成功!')

    // 发送测试邮件
    console.log('发送测试邮件...')
    const info = await transporter.sendMail({
      from: '"InfoPulse 智能简报" <3421637305@qq.com>',
      to: '3421637305@qq.com',
      subject: '📡 InfoPulse 测试邮件 - ' + new Date().toLocaleString('zh-CN'),
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb;">📡 InfoPulse 测试邮件</h1>
          <p>这是一封测试邮件，用于验证邮件发送功能是否正常工作。</p>
          <p>发送时间: ${new Date().toLocaleString('zh-CN')}</p>
          <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 14px;">InfoPulse - 智能新闻聚合系统</p>
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
