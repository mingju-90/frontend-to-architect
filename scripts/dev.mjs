import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const rootDir = fileURLToPath(new URL('..', import.meta.url))
const processDefinitions = [
  {
    name: 'frontend',
    command: 'pnpm',
    args: ['--dir', 'frontend', 'dev'],
  },
  {
    name: 'server',
    command: process.execPath,
    args: ['server/src/index.js'],
  },
]

const children = new Map()
const exitedNames = new Set()
let remainingChildren = processDefinitions.length
let shuttingDown = false
let exitCode = 0
let forceKillTimer

/**
 * 把子进程输出转发到当前终端。
 * @param {string} name
 * @param {NodeJS.ReadableStream} stream
 * @param {NodeJS.WriteStream} target
 * @returns {void}
 */
function forwardOutput(name, stream, target) {
  stream.on('data', (chunk) => {
    target.write(`[${name}] ${chunk}`)
  })
}

/**
 * 向子进程所在的进程组发送信号。
 * @param {import('node:child_process').ChildProcess} child
 * @param {NodeJS.Signals} signal
 * @returns {void}
 */
function signalChild(child, signal) {
  if (!child.pid || child.killed) {
    return
  }

  if (process.platform === 'win32') {
    child.kill(signal)
    return
  }

  try {
    process.kill(-child.pid, signal)
  } catch {
    child.kill(signal)
  }
}

/**
 * 同步关闭前端和中间件进程。
 * @param {string} reason
 * @param {number} code
 * @returns {void}
 */
function shutdown(reason, code = 0) {
  if (shuttingDown) {
    return
  }

  shuttingDown = true
  exitCode = code || exitCode
  console.log(`[dev] ${reason}，正在关闭全部服务...`)

  for (const child of children.values()) {
    signalChild(child, 'SIGTERM')
  }

  forceKillTimer = setTimeout(() => {
    for (const child of children.values()) {
      signalChild(child, 'SIGKILL')
    }
  }, 5000)
}

/**
 * 记录子进程退出，并在需要时关闭其余服务。
 * @param {string} name
 * @param {number | null} code
 * @param {NodeJS.Signals | null} signal
 * @returns {void}
 */
function handleExit(name, code, signal) {
  if (exitedNames.has(name)) {
    return
  }

  exitedNames.add(name)
  remainingChildren -= 1

  const childExitCode = code ?? (signal ? 1 : 0)
  console.log(`[dev] ${name} 已退出`)

  if (!shuttingDown) {
    shutdown(`${name} 退出`, childExitCode)
  }

  if (remainingChildren === 0) {
    clearTimeout(forceKillTimer)
    process.exit(exitCode || childExitCode)
  }
}

/**
 * 启动一个开发服务。
 * @param {{ name: string, command: string, args: string[] }} definition
 * @returns {void}
 */
function startProcess(definition) {
  const child = spawn(definition.command, definition.args, {
    cwd: rootDir,
    env: process.env,
    detached: process.platform !== 'win32',
    stdio: ['inherit', 'pipe', 'pipe'],
  })

  children.set(definition.name, child)
  forwardOutput(definition.name, child.stdout, process.stdout)
  forwardOutput(definition.name, child.stderr, process.stderr)

  child.on('error', (error) => {
    console.error(`[dev] 无法启动 ${definition.name}:`, error)
    handleExit(definition.name, 1, null)
  })

  child.on('close', (code, signal) => {
    handleExit(definition.name, code, signal)
  })
}

process.on('SIGINT', () => shutdown('收到 SIGINT'))
process.on('SIGTERM', () => shutdown('收到 SIGTERM'))

processDefinitions.forEach(startProcess)
