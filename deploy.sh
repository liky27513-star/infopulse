#!/bin/bash

#############################################
# InfoPulse 部署脚本 - Ubuntu 服务器
# 适用于 2核2G 3Mbps 配置
#############################################

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 项目配置
PROJECT_NAME="infopulse"
PROJECT_DIR="/var/www/$PROJECT_NAME"
NODE_VERSION="20"
APP_PORT=3000

#############################################
# 1. 系统初始化
#############################################
log_info "开始系统初始化..."

# 更新系统
log_info "更新系统包..."
apt update && apt upgrade -y

# 安装基础工具
log_info "安装基础工具..."
apt install -y curl wget git vim ufw

# 配置防火墙
log_info "配置防火墙..."
ufw allow ssh
ufw allow http
ufw allow https
ufw --force enable

# 创建 swap 分区（2G 内存建议添加 swap）
log_info "配置 Swap 分区..."
if [ ! -f /swapfile ]; then
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    log_info "Swap 分区创建成功"
else
    log_warn "Swap 分区已存在，跳过"
fi

#############################################
# 2. 安装 Node.js
#############################################
log_info "安装 Node.js $NODE_VERSION..."

# 使用 NodeSource 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_$NODE_VERSION.x | bash -
apt install -y nodejs

# 验证安装
node --version
npm --version

# 配置 npm 国内镜像（可选，加速下载）
log_info "配置 npm 镜像源..."
npm config set registry https://registry.npmmirror.com

#############################################
# 3. 安装 PM2
#############################################
log_info "安装 PM2 进程管理器..."
npm install -g pm2

# 设置 PM2 开机自启
pm2 startup systemd -u root --hp /root

#############################################
# 4. 安装 Nginx
#############################################
log_info "安装 Nginx..."
apt install -y nginx

# 启动 Nginx
systemctl start nginx
systemctl enable nginx

#############################################
# 5. 创建项目目录
#############################################
log_info "创建项目目录..."
mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

#############################################
# 6. 克隆或上传项目代码
#############################################
log_info "准备项目代码..."
log_warn "请选择代码部署方式："
echo "1. 从 Git 仓库克隆（推荐）"
echo "2. 手动上传代码（使用 scp/rsync）"
read -p "请输入选项 (1/2): " deploy_choice

if [ "$deploy_choice" = "1" ]; then
    read -p "请输入 Git 仓库地址: " git_repo
    git clone $git_repo .

    # 如果是私有仓库，需要配置 SSH 密钥
    # 或者使用 Personal Access Token
else
    log_warn "请手动上传代码到 $PROJECT_DIR"
    log_warn "使用命令: scp -r ./infopulse root@your-server-ip:$PROJECT_DIR"
    read -p "代码上传完成后按回车继续..."
fi

#############################################
# 7. 安装项目依赖
#############################################
log_info "安装项目依赖..."
cd $PROJECT_DIR

# 安装依赖
npm install

# 生成 Prisma Client
npm run db:generate

#############################################
# 8. 配置环境变量
#############################################
log_info "配置环境变量..."

if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        log_warn "已创建 .env 文件，请编辑配置："
        log_warn "vim $PROJECT_DIR/.env"
        read -p "配置完成后按回车继续..."
    else
        log_error "未找到 .env.example 文件"
        exit 1
    fi
else
    log_warn ".env 文件已存在，跳过创建"
fi

#############################################
# 9. 初始化数据库
#############################################
log_info "初始化数据库..."
npm run db:push

#############################################
# 10. 构建项目
#############################################
log_info "构建项目..."

# 针对 2G 内存优化构建
export NODE_OPTIONS="--max-old-space-size=1536"
npm run build

#############################################
# 11. 配置 PM2
#############################################
log_info "配置 PM2..."

# 创建 PM2 配置文件
cat > ecosystem.config.js <<EOF
module.exports = {
  apps: [{
    name: '$PROJECT_NAME',
    script: 'npm',
    args: 'start',
    cwd: '$PROJECT_DIR',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: $APP_PORT,
      NODE_OPTIONS: '--max-old-space-size=1536'
    }
  }]
}
EOF

# 启动应用
pm2 start ecosystem.config.js

# 保存 PM2 配置
pm2 save

#############################################
# 12. 配置 Nginx 反向代理
#############################################
log_info "配置 Nginx 反向代理..."

# 创建 Nginx 配置
cat > /etc/nginx/sites-available/$PROJECT_NAME <<EOF
server {
    listen 80;
    server_name _;  # 替换为你的域名或服务器 IP

    # 日志
    access_log /var/log/nginx/$PROJECT_NAME.access.log;
    error_log /var/log/nginx/$PROJECT_NAME.error.log;

    # 反向代理到 Next.js
    location / {
        proxy_pass http://localhost:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;

        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 静态文件缓存
    location /_next/static/ {
        alias $PROJECT_DIR/.next/static/;
        expires 365d;
        access_log off;
    }

    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    gzip_min_length 1000;
}
EOF

# 启用站点配置
ln -sf /etc/nginx/sites-available/$PROJECT_NAME /etc/nginx/sites-enabled/

# 删除默认配置
rm -f /etc/nginx/sites-enabled/default

# 测试 Nginx 配置
nginx -t

# 重载 Nginx
systemctl reload nginx

#############################################
# 13. 配置日志轮转
#############################################
log_info "配置日志轮转..."

cat > /etc/logrotate.d/$PROJECT_NAME <<EOF
$PROJECT_DIR/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 root root
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
EOF

#############################################
# 14. 安装 SSL 证书（可选）
#############################################
log_info "是否配置 SSL 证书？"
read -p "配置 SSL? (y/n): " setup_ssl

if [ "$setup_ssl" = "y" ]; then
    log_info "安装 Certbot..."
    apt install -y certbot python3-certbot-nginx

    read -p "请输入你的域名: " domain_name

    # 更新 Nginx 配置中的 server_name
    sed -i "s/server_name _;/server_name $domain_name;/" /etc/nginx/sites-available/$PROJECT_NAME
    systemctl reload nginx

    # 申请 SSL 证书
    certbot --nginx -d $domain_name

    # 设置自动续期
    systemctl enable certbot.timer
    systemctl start certbot.timer

    log_info "SSL 证书配置完成"
fi

#############################################
# 15. 部署完成
#############################################
log_info "========================================="
log_info "部署完成！"
log_info "========================================="
echo ""
log_info "项目目录: $PROJECT_DIR"
log_info "应用端口: $APP_PORT"
log_info "访问地址: http://$(curl -s ifconfig.me)"
echo ""
log_info "常用命令："
echo "  查看日志: pm2 logs $PROJECT_NAME"
echo "  重启应用: pm2 restart $PROJECT_NAME"
echo "  停止应用: pm2 stop $PROJECT_NAME"
echo "  监控状态: pm2 monit"
echo "  更新代码: cd $PROJECT_DIR && git pull && npm install && npm run build && pm2 restart $PROJECT_NAME"
echo ""
log_warn "请确保已正确配置 .env 文件中的环境变量"
log_warn "特别是数据库连接、API 密钥、邮件配置等"
echo ""
log_info "防火墙状态："
ufw status
