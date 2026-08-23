#!/usr/bin/env bash
set -Eeuo pipefail

# 可通过环境变量覆盖，默认匹配宝塔当前目录结构。
ADMIN_DIR="${ADMIN_DIR:-/www/wwwroot/gupiao-admin}"
SERVER_DIR="${SERVER_DIR:-${ADMIN_DIR}/server}"
MOBILE_REPO_DIR="${MOBILE_REPO_DIR:-/www/wwwroot/stock-frontend}"
MOBILE_WEB_ROOT="${MOBILE_WEB_ROOT:-/www/wwwroot/stock-mobile}"
MOBILE_REPO_URL="${MOBILE_REPO_URL:-git@github.com:asd7313991/gupiao-stock-frontend.git}"
BRANCH="${BRANCH:-main}"
LOCK_FILE="${LOCK_FILE:-/tmp/gupiao-deploy.lock}"
CONFIG_BACKUP_DIR=""

log() { printf '\033[1;34m[%s]\033[0m %s\n' "$(date '+%F %T')" "$*"; }
fail() { printf '\033[1;31m[ERROR]\033[0m %s\n' "$*" >&2; exit 1; }

on_error() {
  local exit_code=$?
  printf '\033[1;31m[%s] 部署失败（步骤：%s，行：%s，退出码：%s）\033[0m\n' \
    "$(date '+%F %T')" "${BASH_COMMAND}" "${BASH_LINENO[0]:-unknown}" "$exit_code" >&2
  exit "$exit_code"
}
trap on_error ERR

restore_production_configs() {
  [[ -n "$CONFIG_BACKUP_DIR" && -d "$CONFIG_BACKUP_DIR" ]] || return 0
  if [[ -f "$CONFIG_BACKUP_DIR/admin.env" ]]; then
    cp -p "$CONFIG_BACKUP_DIR/admin.env" "$ADMIN_DIR/.env"
  fi
  if [[ -f "$CONFIG_BACKUP_DIR/server.config.yaml" ]]; then
    cp -p "$CONFIG_BACKUP_DIR/server.config.yaml" "$SERVER_DIR/config.yaml"
  fi
  rm -rf -- "$CONFIG_BACKUP_DIR"
  CONFIG_BACKUP_DIR=""
}
trap restore_production_configs EXIT

command -v git >/dev/null || fail "未安装 git"
command -v docker >/dev/null || fail "未安装 docker"
command -v curl >/dev/null || fail "未安装 curl"
command -v rsync >/dev/null || fail "未安装 rsync，请执行：apt install -y rsync 或 yum install -y rsync"
command -v flock >/dev/null || fail "系统缺少 flock"

exec 9>"$LOCK_FILE"
flock -n 9 || fail "已有部署任务正在运行"

# 宝塔通常以 www 创建目录，而部署命令由 root 执行，需要显式信任仓库目录。
git config --global --add safe.directory "$ADMIN_DIR"
git config --global --add safe.directory "$SERVER_DIR"
git config --global --add safe.directory "$MOBILE_REPO_DIR"

update_repo() {
  local directory=$1
  local name=$2
  [[ -d "$directory/.git" ]] || fail "$name 不是 Git 仓库：$directory"
  log "强制同步 $name（本地未提交改动将被覆盖）"
  git -C "$directory" fetch --prune origin
  git -C "$directory" reset --hard
  git -C "$directory" clean -fd
  git -C "$directory" checkout -f -B "$BRANCH" "origin/$BRANCH"
  git -C "$directory" reset --hard "origin/$BRANCH"
  git -C "$directory" clean -fd
  log "$name 当前版本：$(git -C "$directory" rev-parse --short HEAD)"
}

[[ -d "$ADMIN_DIR" ]] || fail "后台目录不存在：$ADMIN_DIR"
[[ -d "$SERVER_DIR" ]] || fail "后端目录不存在：$SERVER_DIR"

CONFIG_BACKUP_DIR="$(mktemp -d /tmp/gupiao-config.XXXXXX)"
[[ -f "$ADMIN_DIR/.env" ]] && cp -p "$ADMIN_DIR/.env" "$CONFIG_BACKUP_DIR/admin.env"
[[ -f "$SERVER_DIR/config.yaml" ]] && cp -p "$SERVER_DIR/config.yaml" "$CONFIG_BACKUP_DIR/server.config.yaml"
log "已备份服务器生产配置（.env、server/config.yaml）"

update_repo "$ADMIN_DIR" "后台管理前端"
update_repo "$SERVER_DIR" "Go 后端"
restore_production_configs
log "已恢复服务器生产配置"

if [[ ! -d "$MOBILE_REPO_DIR/.git" ]]; then
  if [[ -e "$MOBILE_REPO_DIR" ]]; then
    log "移动端源码目录不是 Git 仓库，删除后重新克隆：$MOBILE_REPO_DIR"
    rm -rf -- "$MOBILE_REPO_DIR"
  fi
  log "首次克隆移动端仓库"
  git clone --branch "$BRANCH" --single-branch "$MOBILE_REPO_URL" "$MOBILE_REPO_DIR"
else
  update_repo "$MOBILE_REPO_DIR" "移动端前端"
fi

log "安装移动端依赖并执行生产构建"
if command -v node >/dev/null && command -v corepack >/dev/null; then
  log "使用服务器 Node.js 构建移动端"
  corepack pnpm --dir "$MOBILE_REPO_DIR" install --frozen-lockfile
  corepack pnpm --dir "$MOBILE_REPO_DIR" run lint
  corepack pnpm --dir "$MOBILE_REPO_DIR" run build
else
  log "服务器未安装 Node.js，使用 node:22-alpine 容器构建移动端"
  docker run --rm \
    --volume "$MOBILE_REPO_DIR:/app" \
    --workdir /app \
    node:22-alpine \
    sh -c 'corepack enable && corepack prepare pnpm@10.17.1 --activate && pnpm install --frozen-lockfile && pnpm run lint && pnpm run build'
fi
[[ -f "$MOBILE_REPO_DIR/dist/index.html" ]] || fail "移动端构建产物缺少 index.html"

log "构建并重启 Go 后端与后台生产容器"
cd "$ADMIN_DIR"
docker compose --profile production build server production
docker compose --profile production up -d --force-recreate server production

log "等待后端健康检查"
healthy=0
for _ in $(seq 1 60); do
  if curl --silent --fail --max-time 3 "http://127.0.0.1:8081/api/v1/open/health" >/dev/null; then
    healthy=1
    break
  fi
  sleep 2
done
[[ "$healthy" -eq 1 ]] || {
  docker compose logs --tail=100 server >&2
  fail "后端在 120 秒内未通过健康检查"
}

log "发布移动端静态文件到 $MOBILE_WEB_ROOT"
install -d -m 755 "$MOBILE_WEB_ROOT"
rsync -rt --delete --chmod=D755,F644 \
  --exclude='.well-known/' \
  --exclude='.user.ini' \
  --exclude='.htaccess' \
  --exclude='404.html' \
  --exclude='*.zip' \
  "$MOBILE_REPO_DIR/dist/" "$MOBILE_WEB_ROOT/"

log "检查服务状态"
docker compose ps
curl --silent --fail "http://127.0.0.1:8081/api/v1/open/mobile/indices" >/dev/null

log "部署完成"
log "后台管理：由 production 容器提供（宿主机 8080）"
log "移动端目录：$MOBILE_WEB_ROOT"
