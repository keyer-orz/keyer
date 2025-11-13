import { exec } from 'child_process'
import { IExtension, IActionDef, ExtensionResult } from 'keyerext'

// 系统设置项数据库（支持中英文）
interface PreferenceItem {
  name: string
  enName: string
  pane: string
  desc: string
}

const preferencesDatabase: PreferenceItem[] = [
  // 网络相关
  { name: '网络', enName: 'Network', pane: 'Network', desc: '配置网络连接和设置' },
  { name: 'Wi-Fi', enName: 'Wi-Fi', pane: 'Network', desc: '管理无线网络连接' },
  { name: '以太网', enName: 'Ethernet', pane: 'Network', desc: '配置有线网络连接' },
  { name: 'VPN', enName: 'VPN', pane: 'Network', desc: '配置VPN连接' },

  // 其他常用设置
  { name: '通用', enName: 'General', pane: 'General', desc: '系统通用设置' },
  { name: '桌面与屏幕保护程序', enName: 'Desktop & Screen Saver', pane: 'DesktopScreenEffectsPref', desc: '设置桌面背景和屏幕保护' },
  { name: '显示器', enName: 'Displays', pane: 'Displays', desc: '配置显示器设置' },
  { name: '声音', enName: 'Sound', pane: 'Sound', desc: '配置音频设置' },
  { name: '蓝牙', enName: 'Bluetooth', pane: 'Bluetooth', desc: '管理蓝牙设备' },
  { name: '触控板', enName: 'Trackpad', pane: 'Trackpad', desc: '配置触控板设置' },
  { name: '键盘', enName: 'Keyboard', pane: 'Keyboard', desc: '配置键盘设置' },
  { name: '鼠标', enName: 'Mouse', pane: 'Mouse', desc: '配置鼠标设置' },
  { name: '打印机与扫描仪', enName: 'Printers & Scanners', pane: 'PrintAndScan', desc: '管理打印机和扫描仪' },
  { name: '安全性与隐私', enName: 'Security & Privacy', pane: 'Security', desc: '配置安全和隐私设置' },
  { name: '用户与群组', enName: 'Users & Groups', pane: 'Users', desc: '管理用户账户' },
  { name: '共享', enName: 'Sharing', pane: 'Sharing', desc: '配置文件共享和服务' },
  { name: 'iCloud', enName: 'iCloud', pane: 'iCloud', desc: '管理iCloud设置' },
]

class SystemPreferencesExtension implements IExtension {
  private preferences: PreferenceItem[]
  private paneMap: Map<string, string> = new Map() // key -> pane

  constructor() {
    this.preferences = preferencesDatabase
  }

  async onPrepare(): Promise<IActionDef[]> {
    console.log(`System Preferences: Loaded ${this.preferences.length} preference panes`)

    // 清空之前的映射
    this.paneMap.clear()

    // 返回所有系统设置项的 actions
    return this.preferences.map(pref => {
      const actionName = pref.enName.toLowerCase().replace(/\s+/g, '-')
      // 保存 name 到 pane 的映射
      this.paneMap.set(actionName, pref.pane)

      return {
        name: actionName,
        title: `${pref.name}`,
        desc: pref.desc,
        type: 'System'
      }
    })
  }

  async doAction(name: string): Promise<ExtensionResult> {
    console.log('System Preferences: Executing action', name)

    // 从映射中获取 pane
    const pane = this.paneMap.get(name)

    if (!pane) {
      console.error(`Pane not found for name: ${name}`)
      return false
    }

    return new Promise((resolve, reject) => {
      // macOS Ventura (13.0+) 使用 "System Settings.app"
      // macOS Monterey 及之前使用 "System Preferences.app"

      // 尝试使用简单的 open 命令，macOS 会自动处理
      let command = `open -b com.apple.systempreferences`

      // 对于特定面板，尝试不同的方式
      if (pane === 'Network') {
        // 网络设置的特殊处理 - macOS Sequoia (15.x) 使用新的 URL scheme
        command = `open "x-apple.systempreferences:com.apple.wifi-settings-extension"`
      } else {
        // 其他面板尝试标准方式
        command = `open "x-apple.systempreferences:com.apple.preference.${pane}" || open -b com.apple.systempreferences`
      }

      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error('Failed to open preference pane:', stderr)
          // 最后的后备方案：直接打开系统设置
          exec(`open -b com.apple.systempreferences`, (err2) => {
            if (err2) {
              reject(err2)
            } else {
              console.log('Opened System Preferences (fallback)')
              // 打开设置后自动关闭主面板
              resolve(false)
            }
          })
        } else {
          console.log('Opened preference pane:', pane)
          // 打开设置后自动关闭主面板
          resolve(false)
        }
      })
    })
  }
}

export default new SystemPreferencesExtension()
