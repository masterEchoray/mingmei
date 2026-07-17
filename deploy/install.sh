#!/usr/bin/env bash
#
# 海外媒体投放平台 —— 首次安装脚本（阶段一：纯前端静态站点 + Nginx + HTTPS）
#
# 适用系统：Ubuntu 20.04 / 22.04 / 24.04
# 使用方法：
#   1. 把整个项目上传到服务器（例如 /root/ad）
#   2. cd /root/ad/deploy
#   3. sudo bash install.sh
#
# 本脚本为交互式，全程有中文提示。可重复执行（幂等）。
#
set -euo pipefail

# ---------------- 通用输出函数 ----------------
GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info()  { echo -e "${BLUE}[信息]${NC} $*"; }
ok()    { echo -e "${GREEN}[成功]${NC} $*"; }
warn()  { echo -e "${YELLOW}[注意]${NC} $*"; }
err()   { echo -e "${RED}[错误]${NC} $*"; }
step()  { echo -e "\n${GREEN}==== $* ====${NC}"; }

# ---------------- 基本检查 ----------------
if [[ "${EUID}" -ne 0 ]]; then
  err "请使用 root 权限运行：sudo bash install.sh"
  exit 1
fi

# 项目根目录（deploy 的上一级）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
WEB_DIR="${PROJECT_ROOT}/web"
DEPLOY_ROOT="/var/www/ad-web"          # 构建产物部署目录
NGINX_SITE="/etc/nginx/sites-available/ad-web.conf"
NGINX_LINK="/etc/nginx/sites-enabled/ad-web.conf"
ENV_FILE="${SCRIPT_DIR}/.deploy.env"   # 保存域名等配置，供 start.sh 使用

clear
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}   海外媒体投放平台 · 首次安装向导（阶段一）${NC}"
echo -e "${GREEN}================================================${NC}"
echo "本向导将引导你完成：安装依赖 → 构建前端 → 配置 Nginx → 申请 HTTPS 证书"
echo ""

# ---------------- 第 1 步：收集配置 ----------------
step "第 1 步 / 共 6 步：填写站点信息"

read -rp "请输入你的域名（例如 admin.example.com，必须已解析到本服务器公网 IP）: " DOMAIN
while [[ -z "${DOMAIN}" ]]; do
  warn "域名不能为空。"
  read -rp "请输入你的域名: " DOMAIN
done

read -rp "是否需要申请免费 HTTPS 证书？(y/n，默认 y): " NEED_HTTPS
NEED_HTTPS="${NEED_HTTPS:-y}"

EMAIL=""
if [[ "${NEED_HTTPS}" == "y" || "${NEED_HTTPS}" == "Y" ]]; then
  read -rp "请输入你的邮箱（用于证书到期提醒）: " EMAIL
  while [[ -z "${EMAIL}" ]]; do
    warn "申请证书需要邮箱。"
    read -rp "请输入你的邮箱: " EMAIL
  done
fi

echo ""
info "请确认以下信息："
echo "    域名：      ${DOMAIN}"
echo "    申请 HTTPS：${NEED_HTTPS}"
echo "    邮箱：      ${EMAIL:-（不申请证书）}"
echo "    前端源码：  ${WEB_DIR}"
echo "    部署目录：  ${DEPLOY_ROOT}"
read -rp "确认无误请输入 y 继续，输入其它键退出: " CONFIRM
if [[ "${CONFIRM}" != "y" && "${CONFIRM}" != "Y" ]]; then
  warn "已取消安装。"
  exit 0
fi

# ---------------- 第 2 步：安装系统依赖 ----------------
step "第 2 步 / 共 6 步：安装系统依赖（Node.js / Nginx / certbot）"

info "更新软件源..."
apt-get update -y

if ! command -v node >/dev/null 2>&1; then
  info "安装 Node.js 20.x ..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
else
  ok "已检测到 Node.js：$(node -v)"
fi

if ! command -v nginx >/dev/null 2>&1; then
  info "安装 Nginx ..."
  apt-get install -y nginx
else
  ok "已检测到 Nginx"
fi

if [[ "${NEED_HTTPS}" == "y" || "${NEED_HTTPS}" == "Y" ]]; then
  if ! command -v certbot >/dev/null 2>&1; then
    info "安装 certbot（HTTPS 证书工具）..."
    apt-get install -y certbot python3-certbot-nginx
  else
    ok "已检测到 certbot"
  fi
fi

# ---------------- 第 3 步：构建前端 ----------------
step "第 3 步 / 共 6 步：构建前端静态文件"

if [[ ! -d "${WEB_DIR}" ]]; then
  err "未找到前端目录：${WEB_DIR}"
  exit 1
fi

cd "${WEB_DIR}"
info "安装前端依赖（npm ci）..."
if [[ -f package-lock.json ]]; then
  npm ci
else
  npm install
fi

info "开始构建（npm run build）..."
npm run build
ok "前端构建完成，产物位于 ${WEB_DIR}/dist"

# ---------------- 第 4 步：部署静态文件 ----------------
step "第 4 步 / 共 6 步：部署静态文件到 ${DEPLOY_ROOT}"

mkdir -p "${DEPLOY_ROOT}"
rm -rf "${DEPLOY_ROOT:?}/"*
cp -r "${WEB_DIR}/dist/." "${DEPLOY_ROOT}/"
chown -R www-data:www-data "${DEPLOY_ROOT}"
ok "静态文件已部署"

# ---------------- 第 5 步：配置 Nginx ----------------
step "第 5 步 / 共 6 步：配置 Nginx 站点"

cat > "${NGINX_SITE}" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};

    root ${DEPLOY_ROOT};
    index index.html;

    # 单页应用路由回退
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|svg|woff2?)\$ {
        expires 7d;
        add_header Cache-Control "public";
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript image/svg+xml;
}
EOF

ln -sf "${NGINX_SITE}" "${NGINX_LINK}"

# 关闭默认站点，避免冲突
if [[ -e /etc/nginx/sites-enabled/default ]]; then
  rm -f /etc/nginx/sites-enabled/default
fi

info "检查 Nginx 配置..."
nginx -t
systemctl enable nginx >/dev/null 2>&1 || true
systemctl restart nginx
ok "Nginx 已启动并加载站点配置"

# ---------------- 第 6 步：申请 HTTPS 证书 ----------------
step "第 6 步 / 共 6 步：申请 HTTPS 证书"

if [[ "${NEED_HTTPS}" == "y" || "${NEED_HTTPS}" == "Y" ]]; then
  info "使用 certbot 申请证书（需域名已正确解析到本机）..."
  if certbot --nginx -d "${DOMAIN}" --non-interactive --agree-tos -m "${EMAIL}" --redirect; then
    ok "HTTPS 证书申请成功，已自动配置并开启 HTTP→HTTPS 跳转"
    info "证书会自动续期（systemd 定时任务 certbot.timer）"
  else
    err "证书申请失败。常见原因：域名未解析到本机 / 80 端口被防火墙拦截。"
    warn "你可以稍后重新运行本脚本，或手动执行：certbot --nginx -d ${DOMAIN}"
  fi
else
  warn "已跳过 HTTPS 证书申请，站点当前仅支持 http://"
fi

# ---------------- 保存配置，供 start.sh 使用 ----------------
cat > "${ENV_FILE}" <<EOF
DOMAIN=${DOMAIN}
DEPLOY_ROOT=${DEPLOY_ROOT}
WEB_DIR=${WEB_DIR}
NGINX_SITE=${NGINX_SITE}
EOF

echo ""
echo -e "${GREEN}================================================${NC}"
ok "安装完成！"
if [[ "${NEED_HTTPS}" == "y" || "${NEED_HTTPS}" == "Y" ]]; then
  echo -e "  现在可以访问： ${GREEN}https://${DOMAIN}${NC}"
else
  echo -e "  现在可以访问： ${GREEN}http://${DOMAIN}${NC}"
fi
echo -e "  日常维护请使用： ${BLUE}sudo bash ${SCRIPT_DIR}/start.sh status${NC}"
echo -e "${GREEN}================================================${NC}"
