/**
 * 命令执行窗口
 */
import { BrowserWindow, ipcMain } from 'electron'
import { spawn, type ChildProcess } from 'child_process'

interface ExecWindowData {
  window: BrowserWindow
  process?: ChildProcess
}

const execWindows: Map<number, ExecWindowData> = new Map()

/**
 * 初始化 exec 窗口的 IPC 处理器
 */
export function setupExecWindowHandlers() {
  // 启动命令执行
  ipcMain.on('exec-window-start', (event, command: string, cwd?: string) => {
    const windowId = event.sender.id
    const windowData = Array.from(execWindows.values()).find(
      data => data.window.webContents.id === windowId
    )

    if (!windowData) return

    const workDir = cwd || process.cwd()

    // 执行命令
    const proc = spawn(command, [], {
      shell: true,
      cwd: workDir,
      env: process.env
    })

    // 存储进程引用
    windowData.process = proc

    // 监听标准输出
    proc.stdout.on('data', (data) => {
      event.sender.send('exec-window-stdout', data.toString())
    })

    // 监听错误输出
    proc.stderr.on('data', (data) => {
      event.sender.send('exec-window-stderr', data.toString())
    })

    // 监听进程退出
    proc.on('close', (code) => {
      event.sender.send('exec-window-close', code)
    })

    // 监听错误
    proc.on('error', (err) => {
      event.sender.send('exec-window-error', err.message, err.stack)
    })
  })
}

/**
 * 创建命令执行窗口
 */
export function createExecWindow(command: string, cwd?: string): BrowserWindow {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    title: `执行: ${command}`,
    show: false
  })

  // 窗口关闭时清理并终止进程
  win.on('closed', () => {
    const id = win.id
    const windowData = execWindows.get(id)

    if (windowData) {
      // 终止子进程
      if (windowData.process && !windowData.process.killed) {
        console.log(`Killing process for window ${id}`)
        windowData.process.kill('SIGTERM')

        // 如果进程在 2 秒内没有终止，强制杀死
        setTimeout(() => {
          if (windowData.process && !windowData.process.killed) {
            console.log(`Force killing process for window ${id}`)
            windowData.process.kill('SIGKILL')
          }
        }, 2000)
      }

      execWindows.delete(id)
    }
  })

  // 存储窗口引用
  execWindows.set(win.id, { window: win })

  // 生成 HTML 内容
  const html = generateExecHTML(command, cwd)

  // 加载 HTML
  win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)

  // 窗口准备好后显示
  win.once('ready-to-show', () => {
    win.show()
  })

  return win
}

/**
 * 生成执行窗口的 HTML
 */
function generateExecHTML(command: string, cwd?: string): string {
  const workDir = cwd || process.cwd()

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>执行: ${escapeHtml(command)}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
      font-size: 13px;
      background: #1e1e1e;
      color: #d4d4d4;
      padding: 16px;
      overflow-y: auto;
    }
    .header {
      padding: 12px;
      background: #252526;
      border-radius: 4px;
      margin-bottom: 12px;
      border-left: 3px solid #007acc;
    }
    .header-title {
      font-weight: bold;
      color: #4ec9b0;
      margin-bottom: 6px;
    }
    .header-info {
      color: #9cdcfe;
      font-size: 12px;
    }
    .output {
      background: #252526;
      padding: 12px;
      border-radius: 4px;
      white-space: pre-wrap;
      word-wrap: break-word;
      min-height: 300px;
      max-height: calc(100vh - 200px);
      overflow-y: auto;
    }
    .output-line {
      line-height: 1.5;
    }
    .output-error {
      color: #f48771;
    }
    .output-success {
      color: #4ec9b0;
    }
    .status {
      margin-top: 12px;
      padding: 8px 12px;
      background: #252526;
      border-radius: 4px;
      font-size: 12px;
    }
    .status.running {
      border-left: 3px solid #007acc;
      color: #4fc1ff;
    }
    .status.success {
      border-left: 3px solid #4ec9b0;
      color: #4ec9b0;
    }
    .status.error {
      border-left: 3px solid #f48771;
      color: #f48771;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-title">命令执行</div>
    <div class="header-info">命令: ${escapeHtml(command)}</div>
    <div class="header-info">目录: ${escapeHtml(workDir)}</div>
  </div>

  <div class="output" id="output"></div>

  <div class="status running" id="status">
    <span>执行中...</span>
  </div>

  <script>
    const { ipcRenderer } = require('electron');
    const outputEl = document.getElementById('output');
    const statusEl = document.getElementById('status');

    let hasOutput = false;

    // 监听标准输出
    ipcRenderer.on('exec-window-stdout', (event, data) => {
      hasOutput = true;
      const line = document.createElement('div');
      line.className = 'output-line';
      line.textContent = data;
      outputEl.appendChild(line);
      outputEl.scrollTop = outputEl.scrollHeight;
    });

    // 监听错误输出
    ipcRenderer.on('exec-window-stderr', (event, data) => {
      hasOutput = true;
      const line = document.createElement('div');
      line.className = 'output-line output-error';
      line.textContent = data;
      outputEl.appendChild(line);
      outputEl.scrollTop = outputEl.scrollHeight;
    });

    // 监听进程退出
    ipcRenderer.on('exec-window-close', (event, code) => {
      if (code === 0) {
        statusEl.className = 'status success';
        statusEl.textContent = '✓ 执行成功 (退出码: 0)';
      } else {
        statusEl.className = 'status error';
        statusEl.textContent = '✗ 执行失败 (退出码: ' + code + ')';
      }

      if (!hasOutput) {
        const line = document.createElement('div');
        line.className = 'output-line output-success';
        line.textContent = '(命令执行完成，无输出)';
        outputEl.appendChild(line);
      }
    });

    // 监听错误
    ipcRenderer.on('exec-window-error', (event, message, stack) => {
      statusEl.className = 'status error';
      statusEl.textContent = '✗ 执行错误: ' + message;

      const line = document.createElement('div');
      line.className = 'output-line output-error';
      line.textContent = stack || message;
      outputEl.appendChild(line);
    });

    // 启动命令执行
    ipcRenderer.send('exec-window-start', '${command.replace(/'/g, "\\'")}', '${workDir.replace(/'/g, "\\'")}');
  </script>
</body>
</html>
  `.trim()
}

/**
 * HTML 转义
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
