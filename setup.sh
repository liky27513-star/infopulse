#!/bin/bash

echo "🚀 InfoPulse 快速启动脚本"
echo "========================"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 未检测到 Node.js，请先安装 Node.js 18+"
    exit 1
fi

echo "✅ Node.js 版本: $(node -v)"

# 检查 npm
if ! command -v npm &> /dev/null; then
    echo "❌ 未检测到 npm"
    exit 1
fi

echo "✅ npm 版本: $(npm -v)"

# 检查 .env 文件
if [ ! -f .env ]; then
    echo ""
    echo "⚠️  未找到 .env 文件"
    echo "📝 正在从 .env.example 创建 .env ..."
    cp .env.example .env
    echo "✅ 已创建 .env 文件"
    echo ""
    echo "⚠️  请编辑 .env 文件，填写必要的 API 密钥："
    echo "   - NEWS_API_KEY"
    echo "   - ANTHROPIC_API_KEY"
    echo "   - SMTP_USER 和 SMTP_PASS"
    echo ""
    echo "📖 详细获取指南请查看: docs/api-keys-guide.md"
    echo ""
    read -p "按回车键继续..."
fi

# 安装依赖
echo ""
echo "📦 安装依赖..."
npm install

# 生成 Prisma Client
echo ""
echo "🔧 生成 Prisma Client..."
npm run db:generate

# 推送数据库变更
echo ""
echo "🗄️  初始化数据库..."
npm run db:push

echo ""
echo "✅ 设置完成！"
echo ""
echo "🎯 下一步："
echo "   1. 编辑 .env 文件，填写 API 密钥"
echo "   2. 运行: npm run dev"
echo "   3. 访问: http://localhost:3000"
echo ""
echo "📚 文档："
echo "   - README.md - 项目说明"
echo "   - docs/api-keys-guide.md - API 密钥获取指南"
echo ""
