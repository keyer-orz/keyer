/**
 * IPC 粘贴功能处理器
 */
import { ipcMain } from 'electron'
import { exec } from 'child_process'
import { getMainWindow } from './window'

/**
 * 注册粘贴相关的 IPC 处理器
 */
export function setupPasteIPCHandlers() {
  // 模拟粘贴操作
  ipcMain.handle('simulate-paste', simulatePaste)

  // 复制并粘贴（组合操作）
  ipcMain.handle('copy-and-paste', copyAndPaste)
}


/**
 * AppleScript: 切换到前一个应用并粘贴
 */
const PASTE_SCRIPT = `
tell application "System Events"
	-- 模拟 Cmd+Tab 切换应用
	key down command
	keystroke tab
	key up command

	-- 等待应用切换完成
	delay 0.2

	-- 模拟 Cmd+V 粘贴
	keystroke "v" using command down
end tell
`

/**
 * 执行 AppleScript
 */
function executeAppleScript(script: string): Promise<void> {
  return new Promise((resolve, reject) => {
    exec(`osascript -e '${script.replace(/'/g, "'\\''")}'`, (error, stdout, stderr) => {
      if (error) {
        console.error('[Paste] Failed:', error)
        console.error('[Paste] stderr:', stderr)
        reject(error)
      } else {
        console.log('[Paste] Success')
        if (stdout) console.log('[Paste] stdout:', stdout)
        resolve()
      }
    })
  })
}

/**
 * 模拟粘贴操作
 */
export async function simulatePaste(): Promise<void> {
  console.log('[Paste] Switching to previous app and pasting...')
  return executeAppleScript(PASTE_SCRIPT)
}

/**
 * 复制并粘贴（组合操作）
 */
export async function copyAndPaste(): Promise<void> {
  try {
    // 1. 隐藏窗口
    const mainWindow = getMainWindow()
    if (mainWindow) {
      mainWindow.hide()
    }

    // 2. 等待窗口完全隐藏
    await new Promise(resolve => setTimeout(resolve, 150))

    // 3. 切换到前一个应用并粘贴
    console.log('[CopyAndPaste] Switching to previous app and pasting...')
    await executeAppleScript(PASTE_SCRIPT)
  } catch (error) {
    console.error('[CopyAndPaste] Failed:', error)
    throw error
  }
}