@echo off
chcp 65001 >nul
echo 🚀 InfoPulse 快速启动脚本
echo ========================

REM 检查 Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 未检测到 Node.js，请先安装 Node.js 18+
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo ✅ Node.js 版本: %NODE_VERSION%

REM 检查 npm
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 未检测到 npm
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
echo ✅ npm 版本: %NPM_VERSION%

REM 检查 .env 文件
if not exist .env (
    echo.
    echo ⚠️  未找到 .env 文件
    echo 📝 正在从 .env.example 创建 .env ...
    copy .env.example .env >nul
    echo ✅ 已创建 .env 文件
    echo.
    echo ⚠️  请编辑 .env 文件，填写必要的 API 密钥：
    echo    - NEWS_API_KEY
    echo    - ANTHROPIC_API_KEY
    echo    - SMTP_USER 和 SMTP_PASS
    echo.
    echo 📖 详细获取指南请查看: docs\api-keys-guide.md
    echo.
    pause
)

REM 安装依赖
echo.
echo 📦 安装依赖...
call npm install

REM 生成 Prisma Client
echo.
echo 🔧 生成 Prisma Client...
call npm run db:generate

REM 推送数据库变更
echo.
echo 🗄️  初始化数据库...
call npm run db:push

echo.
echo ✅ 设置完成！
echo.
echo 🎯 下一步：
echo    1. 编辑 .env 文件，填写 API 密钥
echo    2. 运行: npm run dev
echo    3. 访问: http://localhost:3000
echo.
echo 📚 文档：
echo    - README.md - 项目说明
echo    - docs\api-keys-guide.md - API 密钥获取指南
echo.
pause
