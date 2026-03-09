# InfoPulse 快速启动指南

## 🚀 5分钟快速启动

### Windows 用户

1. 双击运行 `setup.bat`
2. 按提示填写 `.env` 文件中的 API 密钥
3. 运行 `npm run dev`
4. 访问 http://localhost:3000

### Mac/Linux 用户

```bash
chmod +x setup.sh
./setup.sh
# 按提示填写 .env 文件
npm run dev
```

---

## 📋 最小化配置（快速测试）

如果只想快速测试系统，最少需要配置以下 API：

### 必需配置

```env
# 1. NewsAPI（获取新闻）
NEWS_API_KEY=你的密钥

# 2. Claude API（AI处理）
ANTHROPIC_API_KEY=你的密钥

# 3. QQ邮箱（发送邮件）
SMTP_USER=你的QQ号@qq.com
SMTP_PASS=你的授权码
```

### 可选配置

其他 API 密钥可以暂时留空，系统会跳过相应的数据采集。

---

## 🧪 测试步骤

### 1. 测试首页

访问 http://localhost:3000
- 应该看到 InfoPulse 首页
- 暂时没有新闻数据（正常）

### 2. 测试订阅

访问 http://localhost:3000/subscribe
- 输入邮箱
- 选择关注的类别
- 点击订阅

### 3. 测试手动推送

访问 http://localhost:3000/admin
- 输入管理员密钥（在 `.env` 中的 `ADMIN_SECRET_KEY`）
- 选择 "定时摘要推送"
- 点击触发

等待几分钟，系统会：
1. 采集数据
2. AI 处理
3. 发送邮件

检查邮箱是否收到邮件。

---

## ⚠️ 常见问题

### 问题1: npm install 失败

**解决方案**:
```bash
# 清除缓存
npm cache clean --force

# 使用国内镜像
npm config set registry https://registry.npmmirror.com

# 重新安装
npm install
```

### 问题2: 数据库初始化失败

**解决方案**:
```bash
# 删除旧数据库
rm prisma/dev.db

# 重新初始化
npm run db:push
```

### 问题3: 邮件发送失败

**检查清单**:
- [ ] SMTP 服务已开启
- [ ] 使用的是授权码（不是 QQ 密码）
- [ ] SMTP_HOST 是 `smtp.qq.com`
- [ ] SMTP_PORT 是 `465`

### 问题4: API 调用失败

**检查清单**:
- [ ] API 密钥正确复制（没有多余空格）
- [ ] API 额度未用尽
- [ ] 网络连接正常

---

## 📊 监控和调试

### 查看日志

开发模式下，所有日志会输出到控制台：

```bash
npm run dev
```

查看以下日志：
- ✅ 数据采集成功
- ✅ AI 处理完成
- ✅ 邮件发送成功

### 查看数据库

```bash
npm run db:studio
```

访问 http://localhost:5555 查看：
- 订阅者列表
- 新闻数据
- 推送记录

---

## 🎯 下一步

### 本地测试成功后

1. **部署到 Vercel**
   - 参考 README.md 中的部署章节

2. **配置定时任务**
   - Vercel 会自动运行 Cron Jobs
   - 或使用外部定时任务服务

3. **添加更多订阅者**
   - 分享订阅链接
   - 或在管理后台添加

### 进阶配置

1. **自定义邮件模板**
   - 编辑 `src/lib/email/templates/`

2. **添加新的数据源**
   - 在 `src/lib/collectors/` 添加采集器

3. **调整 AI 提示词**
   - 编辑 `src/lib/ai/summarizer.ts`

---

## 📞 需要帮助？

- 📖 查看 [README.md](../README.md)
- 🔑 查看 [API密钥指南](./api-keys-guide.md)
- 🐛 提交 Issue

---

## ✅ 检查清单

启动前确认：

- [ ] Node.js 18+ 已安装
- [ ] 依赖已安装 (`npm install`)
- [ ] `.env` 文件已配置
- [ ] 至少配置了 NewsAPI 和 Claude API
- [ ] 数据库已初始化 (`npm run db:push`)
- [ ] 开发服务器已启动 (`npm run dev`)

全部完成后，访问 http://localhost:3000 开始使用！
