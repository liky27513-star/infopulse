# Groq API 获取指南（完全免费）

## 🎉 Groq是什么？

Groq是一个提供**超快速AI推理**的平台，使用LPU（Language Processing Unit）技术，速度比传统GPU快10倍！

**特点**：
- ✅ 完全免费（目前）
- ✅ 超快速度
- ✅ 支持Llama 3.1等开源模型
- ✅ 无需信用卡

---

## 📝 获取API Key步骤

### 第1步：访问Groq官网

访问：https://groq.com

或直接访问控制台：https://console.groq.com

### 第2步：注册账号

**方式1：使用Google账号**（推荐）
1. 点击 "Sign in with Google"
2. 选择您的Google账号
3. 自动完成注册

**方式2：使用GitHub账号**
1. 点击 "Sign in with GitHub"
2. 授权Groq访问
3. 自动完成注册

**方式3：邮箱注册**
1. 输入邮箱和密码
2. 验证邮箱
3. 完成注册

### 第3步：创建API Key

1. 登录后，点击左侧菜单 "API Keys"
2. 点击 "Create API Key"
3. 输入Key名称（如："InfoPulse"）
4. 点击 "Create"
5. **重要**：立即复制API Key（只显示一次！）

### 第4步：配置到项目

编辑 `.env` 文件：

```env
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 🆓 免费额度

**当前免费额度**：
- ✅ 无限制使用（目前）
- ✅ 每分钟30次请求
- ✅ 每次请求最多8192 tokens

**是否够用**：
- ✅ 完全够用！
- InfoPulse每天处理约200条新闻
- 每条新闻约2次API调用
- 总计约400次/天 << 30次/分钟限制

---

## 🤖 可用模型

### Llama 3.1 70B Versatile（推荐）⭐⭐⭐⭐⭐

**特点**：
- 最强大的开源模型之一
- 接近GPT-4水平
- 适合复杂任务

**适合**：
- 新闻摘要
- 重要性评分
- 突发事件检测

### Llama 3.1 8B

**特点**：
- 更快速度
- 更低成本
- 质量稍低

**适合**：
- 简单分类
- 快速处理

### Mixtral 8x7B

**特点**：
- 平衡速度和质量
- 多专家架构

---

## 💡 使用建议

### 1. 优化提示词

**好的提示词**：
```
你是一个专业的新闻摘要助手。请用简洁的中文总结新闻，不超过150字。
```

**避免**：
```
帮我总结一下这个新闻
```

### 2. 控制温度参数

**摘要生成**：temperature = 0.3（更稳定）
**分类**：temperature = 0.1（更准确）
**创意任务**：temperature = 0.7（更多样）

### 3. 批量处理

避免频繁调用API，可以批量处理多条新闻。

---

## ⚠️ 注意事项

### 1. API Key安全

- ❌ 不要提交到Git
- ❌ 不要分享给他人
- ✅ 使用环境变量管理

### 2. 速率限制

- 每分钟30次请求
- 超过限制会返回429错误
- 代码中已添加重试逻辑

### 3. 模型选择

- Llama 3.1 70B：质量最好，速度稍慢
- Llama 3.1 8B：速度快，质量稍低
- 根据需求选择

---

## 🔧 故障排查

### 问题1：API Key无效

**错误信息**：`Invalid API Key`

**解决方案**：
1. 检查API Key是否正确复制
2. 确认没有多余空格
3. 重新生成API Key

### 问题2：速率限制

**错误信息**：`Rate limit exceeded`

**解决方案**：
1. 等待1分钟后重试
2. 减少请求频率
3. 使用批量处理

### 问题3：模型不可用

**错误信息**：`Model not found`

**解决方案**：
1. 检查模型名称拼写
2. 使用正确的模型ID：
   - `llama-3.1-70b-versatile`
   - `llama-3.1-8b-versatile`

---

## 📊 成本对比

| AI服务 | 免费额度 | 超出后费用 | 推荐指数 |
|--------|---------|-----------|---------|
| **Groq** | ✅ 无限制 | 未知 | ⭐⭐⭐⭐⭐ |
| Claude | $5 | $3/百万token | ⭐⭐⭐ |
| OpenAI | $0 | $0.5/百万token | ⭐⭐⭐⭐ |
| Gemini | 1500次/天 | 付费 | ⭐⭐⭐⭐ |

---

## 🎯 快速测试

### 测试API Key

创建测试文件 `test-groq.js`：

```javascript
import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
})

async function test() {
  const completion = await groq.chat.completions.create({
    model: 'llama-3.1-70b-versatile',
    messages: [
      { role: 'user', content: 'Hello, Groq!' }
    ]
  })

  console.log(completion.choices[0].message.content)
}

test()
```

运行：
```bash
node test-groq.js
```

---

## 📞 需要帮助？

- Groq文档：https://console.groq.com/docs
- Groq Discord：https://discord.gg/groq
- 项目Issue：提交GitHub Issue

---

## ✅ 总结

**Groq优势**：
- ✅ 完全免费
- ✅ 超快速度
- ✅ 强大模型
- ✅ 简单易用

**获取步骤**：
1. 访问 https://console.groq.com
2. 注册账号
3. 创建API Key
4. 配置到项目

**开始使用**：立即获取API Key，享受免费AI服务！🚀
