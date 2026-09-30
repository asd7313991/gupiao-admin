if ! command -v corepack >/dev/null 2>&1; then
  nvm_home="${NVM_HOME:-${LOCALAPPDATA:-}/nvm}"
  if command -v cygpath >/dev/null 2>&1; then
    nvm_home="$(cygpath -u "$nvm_home")"
  fi
  node_home="$(find "$nvm_home" -mindepth 1 -maxdepth 1 -type d -name 'v20.*' 2>/dev/null | sort -V | tail -n 1)"
  if [ -n "$node_home" ]; then
    export PATH="$node_home:$PATH"
  fi
fi

if ! command -v corepack >/dev/null 2>&1; then
  echo "未找到 corepack，请安装并启用 Node.js 20.19 或更高版本。" >&2
  exit 127
fi