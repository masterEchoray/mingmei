#!/usr/bin/env bash
#
# 海外媒体投放平台 —— 日常运维脚本（阶段一）
#
# 用法：
#   sudo bash start.sh status     查看运行状态（Nginx / 证书有效期 / 站点）
#   sudo bash start.sh start      启动 Nginx
#   sudo bash start.sh stop       停止 Nginx
#   sudo bash start.sh restart    重启 Nginx
#   sudo bash start.sh reload     重新加载配置（不中断服务）
#   sudo bash start.sh logs       查看 Nginx 访问/错误日志（实时）
#   sudo bash start.sh rebuild    重新构建前端并更新部署
#   sudo bash start.sh renew-cert 手动续期 HTTPS 证书
#
set -euo pipefail

GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info()  { echo -e "${BLUE}[信息]${NC} $*"; }
ok()    { echo -e "${GREEN}[成功]${NC} $*"; }
warn()  { echo -e "${YELLOW}[注意]${NC} $*"; }
err()   { echo -e "${RED}[错误]${NC} $*"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/.deploy.env"

# 读取安装时保存的配置
DOMAIN=""; DEPLOY_ROOT="/var/www/ad-web"; WEB_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)/web"
if [[ -f "${ENV_FILE}" ]]; then
  # shellcheck disable=SC1090
  source "${ENV_FILE}"
fi

need_root() {
  if [[ "${EUID}" -ne 0 ]]; then
    err "该操作需要 root 权限，请使用：sudo bash start.sh $1"
    exit 1
  fi
}

usage() {
  echo -e "${GREEN}海外媒体投放平台 · 运维脚本${NC}"
  cat <<EOF

用法： sudo bash start.sh <命令>

可用命令：
  status       查看运行状态（Nginx / 证书有效期 / 站点地址）
  start        启动 Nginx
  stop         停止 Nginx
  restart      重启 Nginx
  reload       重新加载配置（不中断服务）
  logs         实时查看 Nginx 日志（Ctrl+C 退出）
  rebuild      重新构建前端并更新部署目录
  renew-cert   手动续期 HTTPS 证书

当前配置：
  域名：      ${DOMAIN:-（未配置，请先运行 install.sh）}
  部署目录：  ${DEPLOY_ROOT}
  前端源码：  ${WEB_DIR}
EOF
}

cmd_status() {
  echo -e "${GREEN}==== 服务状态 ====${NC}"
  if systemctl is-active --quiet nginx; then
    ok "Nginx 正在运行"
  else
    warn "Nginx 未运行（可执行：sudo bash start.sh start）"
  fi

  echo ""
  echo -e "${GREEN}==== 站点信息 ====${NC}"
  if [[ -n "${DOMAIN}" ]]; then
    echo "  域名： ${DOMAIN}"
  else
    warn "尚未检测到域名配置，请先运行 install.sh"
  fi
  echo "  部署目录： ${DEPLOY_ROOT}"

  echo ""
  echo -e "${GREEN}==== HTTPS 证书 ====${NC}"
  if command -v certbot >/dev/null 2>&1 && [[ -n "${DOMAIN}" ]]; then
    if certbot certificates 2>/dev/null | grep -q "${DOMAIN}"; then
      certbot certificates 2>/dev/null | grep -A2 "${DOMAIN}" | sed 's/^/  /'
    else
      warn "未找到 ${DOMAIN} 的证书（可能未申请 HTTPS）"
    fi
  else
    warn "未安装 certbot 或未配置域名"
  fi
}

cmd_start()   { need_root start;   systemctl start nginx   && ok "Nginx 已启动"; }
cmd_stop()    { need_root stop;    systemctl stop nginx    && ok "Nginx 已停止"; }
cmd_restart() { need_root restart; systemctl restart nginx && ok "Nginx 已重启"; }
cmd_reload()  { need_root reload;  nginx -t && systemctl reload nginx && ok "配置已重新加载"; }

cmd_logs() {
  info "正在实时输出 Nginx 日志，按 Ctrl+C 退出..."
  tail -f /var/log/nginx/access.log /var/log/nginx/error.log
}

cmd_rebuild() {
  need_root rebuild
  if [[ ! -d "${WEB_DIR}" ]]; then
    err "未找到前端目录：${WEB_DIR}"
    exit 1
  fi
  info "重新构建前端..."
  cd "${WEB_DIR}"
  if [[ -f package-lock.json ]]; then npm ci; else npm install; fi
  npm run build
  info "更新部署目录 ${DEPLOY_ROOT} ..."
  mkdir -p "${DEPLOY_ROOT}"
  rm -rf "${DEPLOY_ROOT:?}/"*
  cp -r "${WEB_DIR}/dist/." "${DEPLOY_ROOT}/"
  chown -R www-data:www-data "${DEPLOY_ROOT}"
  systemctl reload nginx
  ok "重新构建并部署完成"
}

cmd_renew_cert() {
  need_root renew-cert
  info "尝试续期证书..."
  certbot renew && systemctl reload nginx && ok "证书续期检查完成"
}

case "${1:-}" in
  status)     cmd_status ;;
  start)      cmd_start ;;
  stop)       cmd_stop ;;
  restart)    cmd_restart ;;
  reload)     cmd_reload ;;
  logs)       cmd_logs ;;
  rebuild)    cmd_rebuild ;;
  renew-cert) cmd_renew_cert ;;
  ""|help|-h|--help) usage ;;
  *) err "未知命令：$1"; echo ""; usage; exit 1 ;;
esac
