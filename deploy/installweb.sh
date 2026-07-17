#!/usr/bin/env bash
#
# 海外媒体投放平台 —— 前端一键部署脚本（installweb.sh）
# 作用：把 web/ 前端构建成静态站点，用 Nginx 对外提供访问，并自动申请 HTTPS 证书。
#
# 适用系统：Ubuntu 20.04 / 22.04 / 24.04（需 root）
#
# 使用步骤（小白照做即可）：
#   1) 先把域名解析到这台服务器的公网 IP（A 记录）。
#   2) 把整个项目上传到服务器，例如上传到 /root/ad
#   3) 执行：
#        cd /root/ad/deploy
#        sudo bash installweb.sh
#   4) 按提示输入「域名」和「邮箱」，等它跑完即可。
#
# 本脚本可重复运行（幂等），跑错了再跑一次也没关系。
#
set -euo pipefail

# ---------------- 颜色输出 ----------------
GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info()  { echo -e "${BLUE}[信息]${NC} $*"; }
ok()    { echo -e "${GREEN}[成功]${NC} $*"; }
warn()  { echo -e "${YELLOW}[注意]${NC} $*"; }
err()   { echo -e "${RED}[错误]${NC} $*"; }
step()  { echo -e "\n${GREEN}==== $* ====${NC}"; }

# ---------------- 前置检查 ----------------
if [[ "${EUID}" -ne 0 ]]; then
  err "请用 root 权限运行：sudo bash installweb.sh"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
WEB_DIR="${PROJECT_ROOT}/web"
DEPLOY_ROOT="/var/www/ad-web"
NGINX_SITE="/etc/nginx/sites-available/ad-web.conf"
NGINX_LINK="/etc/nginx/sites-enabled/ad-web.conf"
ENV_FILE="${SCRIPT_DIR}/.deploy.env"

clear
echo -e "${GREEN}=====================================================${NC}"
echo -e "${GREEN}   海外媒体投放平台 · 前端一键部署（含 HTTPS）${NC}"
echo -e "${GREEN}=====================================================${NC}"
echo "流程：装依赖 → 构建前端 → 配置 Nginx → 开放端口 → 申请 HTTPS 证书"
echo ""

# ---------------- 第 1 步：输入信息 ----------------
step "第 1 步 / 共 7 步：填写站点信息"

read -rp "请输入你的域名（例如 admin.example.com）: " DOMAIN
while [[ -z "${DOMAIN}" ]]; do
  warn "域名不能为空。"
  read -rp "请输入你的域名: " DOMAIN
done

read -rp "请输入邮箱（用于 HTTPS 证书到期提醒）: " EMAIL
while [[ -z "${EMAIL}" ]]; do
  warn "申请 HTTPS 证书需要邮箱。"
  read -rp "请输入邮箱: " EMAIL
done

echo ""
info "请确认："
echo "    域名：     ${DOMAIN}"
echo "    邮箱：     ${EMAIL}"
echo "    前端源码： ${WEB_DIR}"
echo "    部署目录： ${DEPLOY_ROOT}"
read -rp "确认无误输入 y 回车继续（其它键退出）: " CONFIRM
if [[ "${CONFIRM}" != "y" && "${CONFIRM}" != "Y" ]]; then
  warn "已取消。"
  exit 0
fi

# ---------------- 第 2 步：域名解析检测 ----------------
step "第 2 步 / 共 7 步：检测域名解析"

SERVER_IP="$(curl -fsS4 https://ifconfig.me 2>/dev/null || curl -fsS4 https://api.ipify.org 2>/dev/null || echo '')"
DOMAIN_IP="$(getent hosts "${DOMAIN}" | awk '{print $1}' | head -n1 || echo '')"

info "服务器公网 IP：${SERVER_IP:-未知}"
info "域名解析到的 IP：${DOMAIN_IP:-未解析}"

if [[ -n "${SERVER_IP}" && -n "${DOMAIN_IP}" && "${SERVER_IP}" != "${DOMAIN_IP}" ]]; then
  warn "域名解析 IP 与本机公网 IP 不一致，HTTPS 证书可能申请失败。"
  read -rp "仍要继续吗？(y/n，默认 n): " GO
  if [[ "${GO}" != "y" && "${GO}" != "Y" ]]; then
    warn "请先把域名 A 记录解析到 ${SERVER_IP:-本机公网IP} 后重试。"
    exit 0
  fi
elif [[ -z "${DOMAIN_IP}" ]]; then
  warn "无法解析域名，可能尚未配置解析或解析未生效。"
  read -rp "仍要继续吗？(y/n，默认 n): " GO
  if [[ "${GO}" != "y" && "${GO}" != "Y" ]]; then
    exit 0
  fi
else
  ok "域名解析正常"
fi

# ---------------- 第 3 步：安装依赖 ----------------
step "第 3 步 / 共 7 步：安装依赖（Node.js / Nginx / certbot）"

export DEBIAN_FRONTEND=noninteractive
info "更新软件源..."
apt-get update -y

if ! command -v curl >/dev/null 2>&1; then apt-get install -y curl; fi

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

if ! command -v certbot >/dev/null 2>&1; then
  info "安装 certbot（HTTPS 证书工具）..."
  apt-get install -y certbot python3-certbot-nginx
else
  ok "已检测到 certbot"
fi

# ---------------- 第 4 步：构建前端 ----------------
step "第 4 步 / 共 7 步：构建前端静态文件"

if [[ ! -d "${WEB_DIR}" ]]; then
  err "未找到前端目录：${WEB_DIR}"
  exit 1
fi

cd "${WEB_DIR}"
info "安装前端依赖（首次较慢，请耐心等待）..."
if [[ -f package-lock.json ]]; then
  npm ci
else
  npm install
fi

info "开始构建..."
npm run build

if [[ ! -f "${WEB_DIR}/dist/index.html" ]]; then
  err "构建失败：未生成 dist/index.html"
  exit 1
fi
ok "前端构建完成"

# ---------------- 第 5 步：部署静态文件 ----------------
step "第 5 步 / 共 7 步：部署到 ${DEPLOY_ROOT}"

mkdir -p "${DEPLOY_ROOT}"
rm -rf "${DEPLOY_ROOT:?}/"*
cp -r "${WEB_DIR}/dist/." "${DEPLOY_ROOT}/"
chown -R www-data:www-data "${DEPLOY_ROOT}"
ok "静态文件已部署"

# ---------------- 第 6 步：配置 Nginx + 放行端口 ----------------
step "第 6 步 / 共 7 步：配置 Nginx 并开放端口"

cat > "${NGINX_SITE}" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};

    root ${DEPLOY_ROOT};
    index index.html;

    # 单页应用（SPA）路由回退
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Service Worker 不缓存，保证 Mock 及时更新
    location = /mockServiceWorker.js {
        add_header Cache-Control "no-cache";
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
[[ -e /etc/nginx/sites-enabled/default ]] && rm -f /etc/nginx/sites-enabled/default

# 若启用了 ufw 防火墙，放行 80/443
if command -v ufw >/dev/null 2>&1 && ufw status | grep -q "Status: active"; then
  info "检测到 ufw 防火墙，放行 80/443 端口..."
  ufw allow 'Nginx Full' >/dev/null 2>&1 || true
fi

info "检查并重载 Nginx 配置..."
nginx -t
systemctl enable nginx >/dev/null 2>&1 || true
systemctl restart nginx
ok "Nginx 已就绪，此时可通过 http://${DOMAIN} 访问"

# ---------------- 第 7 步：申请 HTTPS 证书 ----------------
step "第 7 步 / 共 7 步：申请 HTTPS 证书并开启跳转"

if certbot --nginx -d "${DOMAIN}" --non-interactive --agree-tos -m "${EMAIL}" --redirect; then
  ok "HTTPS 证书申请成功，已自动开启 HTTP → HTTPS 跳转"
  info "证书会通过 certbot.timer 自动续期，无需手动操作"
  FINAL_URL="https://${DOMAIN}"
else
  err "HTTPS 证书申请失败。常见原因："
  echo "    1) 域名未解析到本机（请检查 A 记录）"
  echo "    2) 80/443 端口被云服务商安全组拦截（去控制台放行）"
  echo "    3) 解析刚改还没生效（等几分钟后重试）"
  warn "站点当前仍可用 http 访问，稍后可重跑本脚本或执行：certbot --nginx -d ${DOMAIN}"
  FINAL_URL="http://${DOMAIN}"
fi

# ---------------- 保存配置，供 start.sh 复用 ----------------
cat > "${ENV_FILE}" <<EOF
DOMAIN=${DOMAIN}
DEPLOY_ROOT=${DEPLOY_ROOT}
WEB_DIR=${WEB_DIR}
NGINX_SITE=${NGINX_SITE}
EOF

echo ""
echo -e "${GREEN}=====================================================${NC}"
ok "前端部署完成！"
echo -e "  访问链接（可以直接放出去）： ${GREEN}${FINAL_URL}${NC}"
echo ""
echo -e "  以后要更新前端，改完代码重新拉取后执行："
echo -e "     ${BLUE}sudo bash ${SCRIPT_DIR}/start.sh rebuild${NC}"
echo -e "  查看运行状态："
echo -e "     ${BLUE}sudo bash ${SCRIPT_DIR}/start.sh status${NC}"
echo -e "${GREEN}=====================================================${NC}"
