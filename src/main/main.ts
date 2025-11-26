import { app, BrowserWindow, ipcMain, globalShortcut } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { exec, spawn } from 'node:child_process'
import Store from 'electron-store'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '..')

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

let win: BrowserWindow | null

// 快捷键配置
const shortcutConfig: Record<string, string> = {
  '@system#main': 'Shift+Space', // This will be overwritten by user config
  '@system#setting': 'Shift+P',
}

function createWindow() {
  const isDev = !!VITE_DEV_SERVER_URL

  win = new BrowserWindow({
    width: 800,
    height: 500,
    show: isDev, // 开发模式下默认显示，生产模式隐藏
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      sandbox: false,
      // webSecurity: false, // 移除以提升安全性
      allowRunningInsecureContent: false
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    // 开发模式下，页面加载完成后显示窗口
    if (isDev && win) {
      win.show()
    }
  })

  // 监听栈变化事件
  ipcMain.on('stack-change', (_event, stackLength: number) => {
    if (stackLength === 0) {
      win?.hide()
    } else if (win && !win.isVisible()) {
      win.show()
    }
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
    win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// 注册全局快捷键
function registerShortcuts() {
  const store = new Store()
  const userShortcut = store.get('globalShortcut') as string

  if (userShortcut) {
    shortcutConfig['@system#main'] = userShortcut
  }

  Object.entries(shortcutConfig).forEach(([pageName, shortcut]) => {
    // 先注销可能存在的旧快捷键（虽然 register 会覆盖，但显式注销更安全）
    if (globalShortcut.isRegistered(shortcut)) {
      // globalShortcut.unregister(shortcut) 
    }

    const success = globalShortcut.register(shortcut, () => {
      console.log(`🔥 Shortcut triggered: ${shortcut} -> ${pageName}`)
      if (win) {
        win.webContents.send('navigate-to-page', pageName)
        if (!win.isVisible()) {
          win.show()
        }
        win.focus()
      }
    })

    if (!success) {
      console.error(`❌ Failed to register shortcut: ${shortcut}`)
    } else {
      console.log(`✅ Registered shortcut: ${shortcut} -> ${pageName}`)
    }
  })
}

// 更新全局快捷键
ipcMain.handle('update-global-shortcut', (_event, newShortcut: string) => {
  const oldShortcut = shortcutConfig['@system#main']

  // 如果新旧快捷键相同，直接返回成功
  if (oldShortcut === newShortcut) return true

  // 注销旧快捷键
  if (oldShortcut && globalShortcut.isRegistered(oldShortcut)) {
    globalShortcut.unregister(oldShortcut)
  }

  // 注册新快捷键
  const success = globalShortcut.register(newShortcut, () => {
    console.log(`🔥 Shortcut triggered: ${newShortcut} -> @system#main`)
    if (win) {
      win.webContents.send('navigate-to-page', '@system#main')
      if (!win.isVisible()) {
        win.show()
      }
      win.focus()
    }
  })

  if (success) {
    shortcutConfig['@system#main'] = newShortcut
    console.log(`✅ Updated shortcut to: ${newShortcut}`)
    return true
  } else {
    console.error(`❌ Failed to register new shortcut: ${newShortcut}`)
    // 尝试恢复旧快捷键
    globalShortcut.register(oldShortcut, () => {
      if (win) {
        win.webContents.send('navigate-to-page', '@system#main')
        if (!win.isVisible()) {
          win.show()
        }
        win.focus()
      }
    })
    return false
  }
})

// 获取应用路径相关信息(这个需要保留在主进程)
ipcMain.handle('get-app-paths', () => {
  return {
    userData: app.getPath('userData'),
    appData: app.getPath('appData'),
    temp: app.getPath('temp'),
    home: app.getPath('home'),
    appRoot: VITE_DEV_SERVER_URL ? process.env.APP_ROOT : undefined
  }
})

// 命令执行 - 系统终端模式
ipcMain.handle('exec-terminal', async (_event, cmd: string, cwd?: string) => {
  try {
    // 在系统默认终端中打开并执行命令
    const workDir = cwd || process.cwd()
    if (process.platform === 'darwin') {
      // macOS: 使用 osascript 打开 Terminal.app
      // 构建 AppleScript 命令
      const script = `
        tell application "Terminal"
          activate
          do script "cd '${workDir.replace(/'/g, "'\\''")}' && ${cmd.replace(/"/g, '\\"')}"
        end tell
      `
      // 执行 AppleScript
      exec(`osascript -e '${script.replace(/'/g, "'\"'\"'")}'`, (error) => {
        if (error) {
          console.error('Failed to execute in Terminal:', error)
        }
      })
    } else if (process.platform === 'win32') {
      // Windows: 打开 cmd
      exec(`start cmd /K "${cmd}"`)
    } else {
      // Linux: 尝试常见终端
      exec(`x-terminal-emulator -e "${cmd}" || xterm -e "${cmd}" || gnome-terminal -- bash -c "${cmd}"`)
    }

    return {
      exitCode: 0,
      stdout: '',
      stderr: '',
      killed: false
    }
  } catch (error) {
    console.error('Failed to execute in terminal:', error)
    throw error
  }
})

// 命令执行 - 新窗口模式
ipcMain.handle('exec-window', async (_event, cmd: string) => {
  return new Promise((resolve) => {
    // 创建新的窗口来显示命令执行过程
    const execWindow = new BrowserWindow({
      width: 800,
      height: 600,
      title: `Executing: ${cmd}`,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    })

    let stdout = ''
    let stderr = ''
    let killed = false

    // 执行命令
    const childProcess = spawn(cmd, {
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe']
    })

    // 构建 HTML 页面
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      margin: 0;
      padding: 20px;
      font-family: 'JetBrains Mono', 'SF Mono', Monaco, monospace;
      font-size: 13px;
      background: #1e1e1e;
      color: #d4d4d4;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 16px;
      border-bottom: 1px solid #333;
    }
    .title {
      font-size: 14px;
      color: #569cd6;
    }
    .status {
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 12px;
    }
    .status.running {
      background: #1a472a;
      color: #4ec9b0;
    }
    .status.completed {
      background: #1e3a5f;
      color: #4fc1ff;
    }
    .status.error {
      background: #5a1e1e;
      color: #f48771;
    }
    .output {
      white-space: pre-wrap;
      word-wrap: break-word;
      line-height: 1.6;
    }
    .stdout { color: #d4d4d4; }
    .stderr { color: #f48771; }
    .actions {
      position: fixed;
      bottom: 20px;
      right: 20px;
      display: flex;
      gap: 8px;
    }
    button {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-family: inherit;
      font-size: 12px;
    }
    .kill-btn {
      background: #c72e0f;
      color: white;
    }
    .close-btn {
      background: #007acc;
      color: white;
    }
    button:hover {
      opacity: 0.8;
    }
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">$ ${cmd.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
    <div class="status running" id="status">Running...</div>
  </div>
  <div class="output" id="output"></div>
  <div class="actions">
    <button class="kill-btn" id="killBtn">Terminate</button>
    <button class="close-btn" id="closeBtn" disabled>Close</button>
  </div>
  <script>
    const { ipcRenderer } = require('electron');
    const output = document.getElementById('output');
    const status = document.getElementById('status');
    const killBtn = document.getElementById('killBtn');
    const closeBtn = document.getElementById('closeBtn');

    ipcRenderer.on('stdout', (_, data) => {
      const line = document.createElement('div');
      line.className = 'stdout';
      line.textContent = data;
      output.appendChild(line);
      output.scrollTop = output.scrollHeight;
    });

    ipcRenderer.on('stderr', (_, data) => {
      const line = document.createElement('div');
      line.className = 'stderr';
      line.textContent = data;
      output.appendChild(line);
      output.scrollTop = output.scrollHeight;
    });

    ipcRenderer.on('exit', (_, code) => {
      status.textContent = code === 0 ? 'Completed' : 'Error (Exit: ' + code + ')';
      status.className = 'status ' + (code === 0 ? 'completed' : 'error');
      killBtn.disabled = true;
      closeBtn.disabled = false;
    });

    ipcRenderer.on('killed', () => {
      status.textContent = 'Terminated';
      status.className = 'status error';
      killBtn.disabled = true;
      closeBtn.disabled = false;
    });

    killBtn.addEventListener('click', () => {
      ipcRenderer.send('kill-process');
    });

    closeBtn.addEventListener('click', () => {
      window.close();
    });
  </script>
</body>
</html>
    `

    execWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)

    // 监听输出
    childProcess.stdout?.on('data', (data) => {
      const text = data.toString()
      stdout += text
      execWindow.webContents.send('stdout', text)
    })

    childProcess.stderr?.on('data', (data) => {
      const text = data.toString()
      stderr += text
      execWindow.webContents.send('stderr', text)
    })

    // 监听进程退出
    childProcess.on('exit', (code) => {
      execWindow.webContents.send('exit', code)
      resolve({
        exitCode: code,
        stdout,
        stderr,
        killed
      })
    })

    // 监听终止请求
    ipcMain.once('kill-process', () => {
      killed = true
      childProcess.kill()
      execWindow.webContents.send('killed')
    })

    // 窗口关闭时终止进程
    execWindow.on('closed', () => {
      if (!childProcess.killed) {
        childProcess.kill()
        killed = true
      }
    })
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  // 初始化 electron-store 以供渲染进程使用
  Store.initRenderer()

  createWindow()
  registerShortcuts()

  console.log("user data:", app.getPath('userData'))
})

app.on('will-quit', () => {
  // 注销所有快捷键
  globalShortcut.unregisterAll()
})
