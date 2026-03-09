# InfoPulse - 智能新闻聚合系统

📡 实时追踪 AI、科技、政治、经济、加密货币、预测市场，定时推送邮件简报

## 功能特性

- ✅ **定时推送** - 每天 09:00、15:00、21:00、03:00（北京时间）自动推送
- ✅ **突发新闻实时推送** - 检测到重大事件立即通知
- ✅ **AI 智能处理** - 使用 Claude API 进行摘要、分类、重要性评分
- ✅ **多数据源** - NewsAPI、CoinGecko、Polymarket、RSS Feeds、Alpha Vantage
- ✅ **Web 界面** - 可公开访问的网站，支持订阅管理
- ✅ **邮件推送** - 精美的 HTML 邮件模板

## 技术栈

- **前端**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **后端**: Next.js API Routes
- **数据库**: SQLite + Prisma ORM
- **AI**: Claude API (Anthropic)
- **邮件**: Nodemailer + React Email
- **定时任务**: node-cron + Vercel Cron Jobs

## 快速开始

### 1. 安装依赖

```bash
cd infopulse
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并填写必要的 API 密钥：

```bash
cp .env.example .env
```

### 3. 初始化数据库

```bash
npm run db:generate
npm run db:push
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## API 密钥获取指南

### 必需的 API 密钥

#### 1. NewsAPI.org

**用途**: 新闻聚合

**获取步骤**:
1. 访问 https://newsapi.org
2. 点击 "Get API Key"
3. 注册账号
4. 复制 API Key

**免费额度**: 每天 100 个请求

#### 2. Claude API (Anthropic)

**用途**: AI 摘要、分类、评分

**获取步骤**:
1. 访问 https://console.anthropic.com
2. 注册账号
3. 创建 API Key
4. 复制 API Key

**费用**: 按使用量计费（Sonnet 4.6 约 $3/百万输入 token）

#### 3. CoinGecko API

**用途**: 加密货币价格数据

**获取步骤**:
1. 访问 https://www.coingecko.com/en/api
2. 点击 "Get API Key"
3. 注册账号
4. 复制 API Key

**免费额度**: 30 次/分钟，10,000 次/月

#### 4. QQ 邮箱 SMTP 授权码

**用途**: 发送邮件

**获取步骤**:
1. 登录 QQ 邮箱
2. 设置 → 账户 → POP3/IMAP/SMTP/Exchange/CardDAV/CalDAV服务
3. 开启 "POP3/SMTP服务"
4. 按提示发送短信验证
5. 获取 **授权码**（不是 QQ 密码！）

### 可选的 API 密钥

#### 5. Alpha Vantage

**用途**: 股票和金融数据

**获取步骤**:
1. 访问 https://www.alphavantage.co/support/#api-key
2. 输入邮箱
3. 获取免费 API Key

**免费额度**: 5 次/分钟，500 次/天

## 部署到 Vercel

### 1. 准备代码

```bash
git init
git add .
git commit -m "Initial commit"
```

### 2. 推送到 GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/infopulse.git
git push -u origin main
```

### 3. 部署到 Vercel

1. 访问 https://vercel.com
2. 点击 "New Project"
3. 导入 GitHub 仓库
4. 配置环境变量（复制 `.env` 中的所有变量）
5. 点击 "Deploy"

### 4. 配置 Cron Jobs

Vercel 会自动读取 `vercel.json` 中的 cron 配置。

需要添加环境变量 `CRON_SECRET` 用于验证 cron 请求：

```bash
CRON_SECRET=your_random_secret_here
```

## 使用说明

### 订阅管理

- 访问 `/subscribe` 页面进行订阅
- 选择关注的领域
- 输入邮箱即可订阅

### 手动触发推送

访问 `/admin` 页面，输入管理员密钥（`ADMIN_SECRET_KEY`）可以手动触发：
- 定时摘要推送
- 突发新闻监控

### 查看历史记录

访问 `/archive` 页面查看过往推送记录

## 项目结构

```
infopulse/
├── prisma/
│   └── schema.prisma          # 数据库模型
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── page.tsx           # 首页
│   │   ├── subscribe/         # 订阅页面
│   │   ├── archive/           # 历史记录
│   │   ├── admin/             # 管理后台
│   │   └── api/               # API 端点
│   ├── lib/
│   │   ├── collectors/        # 数据采集器
│   │   ├── ai/                # AI 处理
│   │   ├── email/             # 邮件发送
│   │   ├── scheduler.ts       # 定时任务
│   │   ├── db.ts              # 数据库
│   │   └── config.ts          # 配置
│   └── components/            # React 组件
├── .env.example               # 环境变量模板
├── vercel.json                # Vercel 配置
└── README.md                  # 本文件
```

## 开发命令

```bash
# 开发
npm run dev

# 构建
npm run build

# 启动生产服务器
npm start

# 数据库操作
npm run db:generate    # 生成 Prisma Client
npm run db:push        # 推送数据库变更
npm run db:studio      # 打开 Prisma Studio

# 代码检查
npm run lint
```

## 注意事项

1. **API 密钥安全**: 不要将 `.env` 文件提交到 Git
2. **速率限制**: 注意各 API 的速率限制，避免超额
3. **邮件发送**: QQ 邮箱每日发送有限额，建议测试时使用少量订阅者
4. **Claude API 费用**: 监控 API 使用量，避免意外高额费用

## 故障排查

### 邮件发送失败

- 检查 SMTP 配置是否正确
- 确认使用的是授权码而非 QQ 密码
- 检查 QQ 邮箱是否开启了 SMTP 服务

### 数据采集失败

- 检查 API 密钥是否有效
- 查看控制台错误日志
- 确认 API 额度是否用尽

### AI 处理失败

- 检查 Claude API 密钥
- 确认账户余额充足
- 查看错误日志

## 许可证

MIT

## 联系方式

如有问题，请提交 Issue 或 Pull Request。
