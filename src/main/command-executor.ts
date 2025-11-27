import { BrowserWindow, ipcMain } from 'electron'
import { exec, spawn, ChildProcess } from 'node:child_process'

/**
 * 在系统终端中执行命令
 */
export async function executeInTerminal(cmd: string, cwd?: string): Promise<{
  exitCode: number
  stdout: string
  stderr: string
  killed: boolean
}> {
  try {
    const workDir = cwd || process.cwd()

    if (process.platform === 'darwin') {
      // macOS: 使用 osascript 打开 Terminal.app
      const script = `
        tell application "Terminal"
          activate
          do script "cd '${workDir.replace(/'/g, "'\\''")}' && ${cmd.replace(/"/g, '\\"')}"
        end tell
      `
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
}

/**
 * 在新窗口中执行命令
 */
export async function executeInWindow(cmd: string): Promise<{
  exitCode: number | null
  stdout: string
  stderr: string
  killed: boolean
}> {
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
    const childProcess: ChildProcess = spawn(cmd, {
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe']
    })

    // 构建 HTML 页面
    const html = buildExecutionWindowHTML(cmd)
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
}

/**
 * 构建命令执行窗口的 HTML
 */
function buildExecutionWindowHTML(cmd: string): string {
  return `
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
}
