# API 密钥获取详细指南

本文档提供所有必需和可选 API 密钥的详细获取步骤。

## 📋 必需的 API 密钥

### 1. NewsAPI.org - 新闻聚合

**用途**: 获取全球新闻

**免费额度**: 每天 100 个请求

**获取步骤**:

1. 访问 https://newsapi.org
2. 点击右上角 "Get API Key"
3. 填写注册信息：
   - Email: 您的邮箱
   - Password: 设置密码
4. 验证邮箱
5. 登录后，在 Dashboard 页面可以看到您的 API Key
6. 复制 API Key 到 `.env` 文件的 `NEWS_API_KEY`

**注意事项**:
- 免费版仅支持 HTTP 开头的 URL（开发环境）
- 生产环境需要付费版本

---

### 2. Claude API (Anthropic) - AI 处理

**用途**: 新闻摘要、分类、重要性评分

**费用**: 按使用量计费
- Sonnet 4.6: $3 / 百万输入 token, $15 / 百万输出 token
- 预估成本: 每次推送约 $0.01-0.05

**获取步骤**:

1. 访问 https://console.anthropic.com
2. 点击 "Sign Up" 注册账号
3. 填写信息并验证邮箱
4. 登录后，点击左侧 "API Keys"
5. 点击 "Create Key"
6. 输入 Key 名称（如: "InfoPulse"）
7. 复制生成的 API Key（只显示一次！）
8. 粘贴到 `.env` 文件的 `ANTHROPIC_API_KEY`

**注意事项**:
- 新账号有 $5 免费额度
- 建议设置使用限额避免超额
- 保留好 API Key，丢失需要重新生成

---

### 3. CoinGecko API - 加密货币数据

**用途**: 获取加密货币价格和市场数据

**免费额度**: 30 次/分钟，10,000 次/月

**获取步骤**:

1. 访问 https://www.coingecko.com/en/api
2. 点击 "Get API Key"
3. 注册账号：
   - Email
   - Password
   - 验证邮箱
4. 登录后，在 Dashboard 可以看到 API Key
5. 复制到 `.env` 文件的 `COINGECKO_API_KEY`

**注意事项**:
- 免费版有速率限制
- 如果不需要加密货币数据，可以不配置

---

### 4. QQ 邮箱 SMTP 授权码 - 邮件发送

**用途**: 发送邮件通知

**获取步骤**:

1. 登录 QQ 邮箱 (https://mail.qq.com)
2. 点击右上角 "设置" → "账户"
3. 向下滚动到 "POP3/IMAP/SMTP/Exchange/CardDAV/CalDAV服务"
4. 找到 "POP3/SMTP服务"，点击 "开启"
5. 按提示发送短信验证：
   - 使用绑定 QQ 的手机号
   - 发送指定内容到指定号码
6. 验证成功后，会显示 **授权码**
7. **重要**: 复制授权码（不是 QQ 密码！）
8. 粘贴到 `.env` 文件的 `SMTP_PASS`

**配置示例**:
```env
SMTP_HOST=smtp.qq.com
SMTP_PORT=465
SMTP_USER=你的QQ号@qq.com
SMTP_PASS=你的授权码（16位字母数字）
```

**注意事项**:
- 授权码只显示一次，务必保存
- 每日发送有限额（约 500 封）
- 如需更多额度，可以申请企业邮箱

---

## 📦 可选的 API 密钥

### 5. Alpha Vantage - 金融数据

**用途**: 股票、经济指标数据

**免费额度**: 5 次/分钟，500 次/天

**获取步骤**:

1. 访问 https://www.alphavantage.co/support/#api-key
2. 输入您的邮箱
3. 点击 "Get Free API Key"
4. API Key 会发送到您的邮箱
5. 复制到 `.env` 文件的 `ALPHA_VANTAGE_API_KEY`

**注意事项**:
- 速率限制较严格
- 如果不需要股票数据，可以不配置

---

### 6. NewsData.io - 备用新闻源

**用途**: NewsAPI 的备用方案

**免费额度**: 每天 200 个请求

**获取步骤**:

1. 访问 https://newsdata.io
2. 点击 "Get API Key"
3. 注册账号
4. 在 Dashboard 获取 API Key
5. 复制到 `.env` 文件的 `NEWSDATA_API_KEY`

---

## 🔧 环境变量配置清单

创建 `.env` 文件并填写以下内容：

```env
# 新闻 API（必需）
NEWS_API_KEY=你的newsapi密钥

# AI API（必需）
ANTHROPIC_API_KEY=你的claude密钥

# 加密货币（可选，但推荐）
COINGECKO_API_KEY=你的coingecko密钥

# 邮件配置（必需）
SMTP_HOST=smtp.qq.com
SMTP_PORT=465
SMTP_USER=你的QQ号@qq.com
SMTP_PASS=你的QQ邮箱授权码

# 默认收件人
DEFAULT_RECIPIENT=3421637305@qq.com

# 数据库
DATABASE_URL="file:./dev.db"

# 站点配置
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# 管理员密钥（自己设置一个随机字符串）
ADMIN_SECRET_KEY=infopulse_admin_2026

# Cron 密钥（自己设置一个随机字符串）
CRON_SECRET=infopulse_cron_2026
```

---

## 💡 快速测试

配置完成后，可以测试各个 API：

### 测试 NewsAPI
```bash
curl "https://newsapi.org/v2/top-headlines?country=us&apiKey=你的API_KEY"
```

### 测试 Claude API
```bash
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: 你的API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-sonnet-4-6-20250514","max_tokens":10,"messages":[{"role":"user","content":"hi"}]}'
```

### 测试 CoinGecko
```bash
curl "https://api.coingecko.com/api/v3/ping"
```

---

## ❓ 常见问题

### Q: NewsAPI 提示 "cors" 错误？
A: 免费版不支持浏览器直接调用，需要通过后端 API 调用。本项目已处理后端调用。

### Q: Claude API 费用太高？
A: 可以使用 OpenAI API 作为替代，修改代码中的 AI 处理部分。

### Q: QQ 邮箱发送失败？
A:
- 确认使用的是授权码而非 QQ 密码
- 检查 SMTP 服务是否已开启
- 查看是否超过每日发送限额

### Q: 可以使用其他邮箱吗？
A: 可以，修改 SMTP 配置：
- Gmail: `smtp.gmail.com`, 端口 587
- Outlook: `smtp-mail.outlook.com`, 端口 587
- 163邮箱: `smtp.163.com`, 端口 465

---

## 📞 需要帮助？

如果遇到问题：
1. 查看项目 README.md
2. 检查控制台错误日志
3. 提交 GitHub Issue
