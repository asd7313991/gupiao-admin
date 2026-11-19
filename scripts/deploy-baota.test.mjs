import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  existsSync,
  rmSync,
  copyFileSync
} from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'

const scripts = path.dirname(fileURLToPath(import.meta.url))
const bash =
  process.env.BASH_PATH ||
  (process.platform === 'win32'
    ? path.resolve(
        execFileSync('git', ['--exec-path'], { encoding: 'utf8' }).trim(),
        '..',
        '..',
        '..',
        'bin',
        'bash.exe'
      )
    : 'bash')
const shellPath = (value) =>
  process.platform === 'win32'
    ? value.replaceAll('\\', '/').replace(/^([A-Za-z]):/, (_, drive) => `/${drive.toLowerCase()}`)
    : value

function fixture(t, manager = 'npm') {
  const root = mkdtempSync(path.join(os.tmpdir(), 'gupiao-deploy-test-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const project = path.join(root, 'mobile source')
  const bin = path.join(root, 'bin')
  const log = path.join(root, 'commands.log')
  mkdirSync(project)
  mkdirSync(bin)
  writeFileSync(path.join(project, 'package.json'), '{"name":"test","private":true}')
  const lock = manager === 'pnpm' ? 'pnpm-lock.yaml' : 'package-lock.json'
  writeFileSync(path.join(project, lock), 'lock-v1')
  const mock = (name, body) =>
    writeFileSync(path.join(bin, name), `#!/bin/bash\nset -eu\n${body}\n`, { mode: 0o755 })
  const packageMock = (name, prefix) => `
if [[ "\${1:-}" == --version ]]; then printf '%s\\n' "\${TEST_MANAGER_VERSION:-1}"; exit; fi
printf '${name} %s\\n' "$*" >> "$TEST_LOG"
if [[ "\${1:-}" == ci || "\${1:-}" == install ]]; then
  [[ "\${TEST_FAIL_INSTALL:-0}" != 1 ]] || exit 17
  mkdir -p node_modules/.bin
fi
[[ "\${TEST_FAIL_STEP:-}" != "$*" ]] || exit 18
${prefix}`
  mock('npm', packageMock('npm', ''))
  mock('corepack', '[[ "${1:-}" == pnpm ]] && shift\n' + packageMock('pnpm', ''))
  const env = {
    ...process.env,
    TEST_LOG: shellPath(log),
    FORCE_MOBILE_INSTALL: '0',
    TEST_FAIL_STEP: '',
    TEST_FAIL_INSTALL: '0',
    TEST_MANAGER_VERSION: '1'
  }
  const run = (
    runtime = 'host',
    overrides = {},
    script = path.join(scripts, 'build-mobile.sh'),
    args = [shellPath(project), runtime]
  ) =>
    spawnSync(
      bash,
      [
        '--noprofile',
        '--norc',
        '-c',
        'export PATH="$1:$PATH"; shift; exec bash "$@"',
        'test',
        shellPath(bin),
        shellPath(script),
        ...args
      ],
      {
        cwd: root,
        env: { ...env, ...overrides },
        encoding: 'utf8',
        timeout: 30_000
      }
    )
  const ok = (result) =>
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}\n${result.error || ''}`)
  const lines = () => (existsSync(log) ? readFileSync(log, 'utf8').trim().split('\n') : [])
  const installs = () =>
    lines().filter((line) => /^(npm ci|npm install|pnpm install)/.test(line)).length
  return { root, project, bin, log, lock, mock, run, ok, lines, installs, env }
}

test('npm 复用依赖但每次检查构建，依赖/配置/版本/环境变化后重装', (t) => {
  const f = fixture(t)
  f.ok(f.run())
  f.ok(f.run())
  writeFileSync(path.join(f.project, 'source.ts'), 'export const changed = true')
  f.ok(f.run())
  assert.equal(f.installs(), 1)
  assert.equal(f.lines().filter((line) => line === 'npm run lint').length, 3)
  assert.equal(f.lines().filter((line) => line === 'npm run build').length, 3)
  for (const [file, content] of [
    [f.lock, 'lock-v2'],
    ['package.json', '{"name":"changed"}'],
    ['.npmrc', 'audit=false']
  ]) {
    const before = f.installs()
    writeFileSync(path.join(f.project, file), content)
    f.ok(f.run())
    assert.equal(f.installs(), before + 1)
  }
  let before = f.installs()
  f.ok(f.run('host', { TEST_MANAGER_VERSION: '2' }))
  assert.equal(f.installs(), ++before)
  f.ok(f.run('host', { TEST_MANAGER_VERSION: '2', FORCE_MOBILE_INSTALL: '1' }))
  assert.equal(f.installs(), ++before)
  f.ok(f.run('docker-node22-alpine', { TEST_MANAGER_VERSION: '2' }))
  assert.equal(f.installs(), ++before)
  f.ok(f.run('docker-node22-alpine', { TEST_MANAGER_VERSION: '2' }))
  assert.equal(f.installs(), before)
  f.ok(f.run('docker-node22-alpine', { TEST_MANAGER_VERSION: '2', npm_config_omit: 'optional' }))
  assert.equal(f.installs(), ++before)
  rmSync(path.join(f.project, 'node_modules', '.bin'), { recursive: true })
  f.ok(f.run('docker-node22-alpine', { TEST_MANAGER_VERSION: '2', npm_config_omit: 'optional' }))
  assert.equal(f.installs(), ++before)
})

test('pnpm 安装成功才记录复用标记；安装/检查失败立即退出', (t) => {
  const f = fixture(t, 'pnpm')
  f.ok(f.run())
  f.ok(f.run())
  assert.equal(f.installs(), 1)
  writeFileSync(path.join(f.project, f.lock), 'lock-v2')
  assert.notEqual(f.run('host', { TEST_FAIL_INSTALL: '1' }).status, 0)
  assert.ok(!existsSync(path.join(f.project, 'node_modules', '.gupiao-dependencies.sha256')))
  f.ok(f.run())
  assert.equal(f.installs(), 3)
  const before = f.lines().filter((line) => line === 'pnpm run build').length
  assert.notEqual(f.run('host', { TEST_FAIL_STEP: 'run lint' }).status, 0)
  assert.equal(f.lines().filter((line) => line === 'pnpm run build').length, before)
})

test('没有锁文件不复用安装结果', (t) => {
  const f = fixture(t)
  rmSync(path.join(f.project, f.lock))
  f.ok(f.run())
  f.ok(f.run())
  assert.equal(f.installs(), 2)
  assert.ok(f.lines().includes('npm install'))
})

test('部署宿主机和容器两条路径，串行构建且不执行缓存/数据清理', (t) => {
  for (const dockerOnly of [false, true]) {
    const f = fixture(t)
    const admin = path.join(f.root, 'admin')
    const server = path.join(admin, 'server')
    const web = path.join(f.root, 'web')
    mkdirSync(path.join(admin, '.git'), { recursive: true })
    mkdirSync(path.join(admin, 'scripts'))
    mkdirSync(path.join(server, '.git'), { recursive: true })
    mkdirSync(path.join(f.project, '.git'))
    for (const name of ['deploy-baota.sh', 'build-mobile.sh']) {
      copyFileSync(path.join(scripts, name), path.join(admin, 'scripts', name))
    }
    for (const name of [
      'api/app/v1/open/mobile/router.go',
      'api/app/v1/open/mobile/auth.go',
      'api/app/v1/open/mobile/market.go',
      'api/auth/customer.go',
      'api/middleware/customer_jwt.go'
    ]) {
      const file = path.join(server, name)
      mkdirSync(path.dirname(file), { recursive: true })
      writeFileSync(file, '')
    }
    mkdirSync(path.join(f.project, 'dist'))
    writeFileSync(path.join(f.project, 'dist', 'index.html'), 'test')
    f.mock('git', '[[ "$*" != *"rev-parse --short HEAD"* ]] || echo test-commit')
    f.mock('install', '[[ "$1" == -d && "$2" == -m ]]; shift 3; mkdir -p "$@"')
    for (const name of ['curl', 'rsync', 'flock'])
      f.mock(name, `printf '${name} %s\\n' "$*" >> "$TEST_LOG"`)
    f.mock(
      'docker',
      `
printf 'docker %s\\n' "$*" >> "$TEST_LOG"
if [[ "\${TEST_FAIL_DOCKER:-0}" == 1 && "$*" == *"build server"* ]]; then exit 19; fi
if [[ "\${1:-}" == run ]]; then
  project=''; helper=''
  while [[ "\${1:-}" != node:22-alpine ]]; do
    if [[ "\${1:-}" == --volume ]]; then
      case "$2" in
        *:/app) project="\${2%:/app}" ;;
        *:/deploy-build-mobile.sh:ro) helper="\${2%:/deploy-build-mobile.sh:ro}" ;;
      esac
      shift
    fi
    shift
  done
  shift
  [[ "$1" == sh && "$2" == -c ]]
  command="$3"
  command="\${command//\\/deploy-build-mobile.sh/\\"$helper\\"}"
  command="\${command//\\/app/\\"$project\\"}"
  sh -c "$command"
fi`
    )
    const bashEnv = path.join(f.root, 'bash-env')
    writeFileSync(
      bashEnv,
      'command() { if [[ "${TEST_DOCKER_ONLY:-0}" == 1 && "$*" == "-v node" ]]; then return 1; fi; builtin command "$@"; }\n'
    )
    const environment = {
      ADMIN_DIR: shellPath(admin),
      SERVER_DIR: shellPath(server),
      MOBILE_REPO_DIR: shellPath(f.project),
      MOBILE_WEB_ROOT: shellPath(web),
      VERIFICATION_STORAGE_DIR: shellPath(path.join(f.root, 'materials')),
      LOCK_FILE: shellPath(path.join(f.root, 'deploy.lock')),
      BASH_ENV: shellPath(bashEnv),
      TEST_DOCKER_ONLY: dockerOnly ? '1' : '0'
    }
    const deploy = (overrides = {}) =>
      f.run(
        'host',
        { ...environment, ...overrides },
        path.join(admin, 'scripts', 'deploy-baota.sh'),
        []
      )
    f.ok(deploy())
    f.ok(deploy())
    assert.equal(f.installs(), 1)
    const builds = f
      .lines()
      .filter((line) => line.startsWith('docker compose --profile production build'))
    assert.deepEqual(builds, [
      'docker compose --profile production build server',
      'docker compose --profile production build production',
      'docker compose --profile production build server',
      'docker compose --profile production build production'
    ])
    assert.equal(
      f.lines().some((line) => /prune|down.*--volumes/.test(line)),
      false
    )
    const publications = f.lines().filter((line) => line.startsWith('rsync ')).length
    assert.notEqual(deploy({ TEST_FAIL_DOCKER: '1' }).status, 0)
    assert.equal(f.lines().filter((line) => line.startsWith('rsync ')).length, publications)
    assert.notEqual(deploy({ TEST_FAIL_STEP: 'run lint' }).status, 0)
    assert.equal(f.lines().filter((line) => line.startsWith('rsync ')).length, publications)
    assert.equal(
      f.lines().some((line) => line.startsWith('docker run')),
      dockerOnly
    )
  }
})
