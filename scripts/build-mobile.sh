#!/bin/sh
set -eu

fail() { printf '[ERROR] %s\n' "$*" >&2; exit 1; }
log() { printf '[mobile-build] %s\n' "$*"; }

[ "$#" -ge 1 ] || fail "缺少移动端源码目录"
cd "$1"
[ -f package.json ] || fail "移动端目录缺少 package.json"
runtime="${2:-host}"
marker="node_modules/.gupiao-dependencies.sha256"

if [ -f pnpm-lock.yaml ]; then
  command -v corepack >/dev/null || fail "移动端使用 pnpm，但未安装 corepack"
  manager=pnpm
  manager_version="$(corepack pnpm --version)"
  lockfile=pnpm-lock.yaml
else
  manager=npm
  manager_version="$(npm --version)"
  lockfile=package-lock.json
fi

fingerprint() {
  node - "$manager" "$manager_version" "$runtime" <<'NODE'
const fs = require('node:fs')
const { createHash } = require('node:crypto')
const hash = createHash('sha256')
hash.update(JSON.stringify([process.version, process.platform, process.arch, ...process.argv.slice(2)]))
for (const name of ['package.json', 'package-lock.json', 'pnpm-lock.yaml', '.npmrc', '.pnpmfile.cjs', 'pnpm-workspace.yaml']) {
  hash.update(JSON.stringify([name, fs.existsSync(name) ? fs.readFileSync(name, 'utf8') : null]))
}
for (const key of Object.keys(process.env).filter(key => /^(npm_config_|pnpm_config_)/i.test(key) || ['NODE_ENV', 'CI'].includes(key)).sort()) {
  hash.update(JSON.stringify([key, process.env[key]]))
}
console.log(hash.digest('hex'))
NODE
}

signature="$(fingerprint)"
if [ "${FORCE_MOBILE_INSTALL:-0}" != 1 ] &&
  [ -f "$lockfile" ] && [ -d node_modules/.bin ] && [ -f "$marker" ] &&
  [ "$(cat "$marker")" = "$signature" ]; then
  log "依赖、包管理器和运行环境未变化，复用 node_modules"
else
  log "依赖或运行环境变化，重新安装移动端依赖"
  rm -f "$marker"
  if [ "$manager" = pnpm ]; then
    corepack pnpm install --frozen-lockfile
  elif [ -f package-lock.json ]; then
    npm ci
  else
    log "没有锁文件，使用 npm install；无锁文件时不复用安装结果"
    npm install
  fi
  signature="$(fingerprint)"
  mkdir -p node_modules
  printf '%s\n' "$signature" > "$marker"
fi

if [ "$manager" = pnpm ]; then
  corepack pnpm run lint
  corepack pnpm run build
else
  npm run lint
  npm run build
fi
