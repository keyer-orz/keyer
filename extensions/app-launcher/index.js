const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')

// 应用数据库（包含中英文名称）
const appDatabase = [
  // 实用工具
  { name: '计算器', enName: 'Calculator', path: '/System/Applications/Calculator.app', category: 'Utilities' },
  { name: '日历', enName: 'Calendar', path: '/System/Applications/Calendar.app', category: 'Utilities' },
  { name: '终端', enName: 'Terminal', path: '/System/Applications/Utilities/Terminal.app', category: 'Utilities' },
  { name: '活动监视器', enName: 'Activity Monitor', path: '/System/Applications/Utilities/Activity Monitor.app', category: 'Utilities' },
  { name: '磁盘工具', enName: 'Disk Utility', path: '/System/Applications/Utilities/Disk Utility.app', category: 'Utilities' },
  { name: '系统信息', enName: 'System Information', path: '/System/Applications/Utilities/System Information.app', category: 'Utilities' },
  { name: '屏幕截图', enName: 'Screenshot', path: '/System/Applications/Utilities/Screenshot.app', category: 'Utilities' },
  { name: '文本编辑', enName: 'TextEdit', path: '/System/Applications/TextEdit.app', category: 'Utilities' },

  // 其他常用应用
  { name: 'Safari浏览器', enName: 'Safari', path: '/System/Applications/Safari.app', category: 'Internet' },
  { name: '邮件', enName: 'Mail', path: '/System/Applications/Mail.app', category: 'Internet' },
  { name: '通讯录', enName: 'Contacts', path: '/System/Applications/Contacts.app', category: 'Personal' },
  { name: '地图', enName: 'Maps', path: '/System/Applications/Maps.app', category: 'Travel' },
  { name: '音乐', enName: 'Music', path: '/System/Applications/Music.app', category: 'Entertainment' },
]

class AppLauncherExtension {
  constructor() {
    this.apps = []
  }

  async onPrepare() {
    // 扫描应用程序目录
    await this.scanApplications()
    console.log(`App Launcher: Loaded ${this.apps.length} applications`)
  }

  async scanApplications() {
    // 从预定义数据库加载
    this.apps = appDatabase.filter(app => fs.existsSync(app.path))

    // 扫描 /Applications 目录
    try {
      const appsDir = '/Applications'
      if (fs.existsSync(appsDir)) {
        const files = fs.readdirSync(appsDir)

        for (const file of files) {
          if (file.endsWith('.app')) {
            const appPath = path.join(appsDir, file)
            const appName = file.replace('.app', '')

            // 检查是否已在数据库中
            if (!this.apps.find(app => app.path === appPath)) {
              this.apps.push({
                name: appName,
                enName: appName,
                path: appPath,
                category: 'Other'
              })
            }
          }
        }
      }
    } catch (error) {
      console.error('Error scanning applications:', error)
    }
  }

  async onSearch(input) {
    if (!input) {
      return []
    }

    const lowerInput = input.toLowerCase()

    // 搜索匹配的应用（支持中英文）
    const matchedApps = this.apps.filter(app => {
      const matchName = app.name.toLowerCase().includes(lowerInput)
      const matchEnName = app.enName.toLowerCase().includes(lowerInput)
      const matchCategory = app.category.toLowerCase().includes(lowerInput)

      return matchName || matchEnName || matchCategory
    })

    // 返回搜索结果
    return matchedApps.map(app => ({
      id: `com.keyer.app-launcher.open.${app.enName}`,
      name: `打开 ${app.name}`,
      desc: `${app.enName} - ${app.category}`,
      ext: {
        type: 'app-launcher',
        appPath: app.path
      }
    }))
  }

  async doAction(action) {
    if (action.ext && action.ext.type === 'app-launcher') {
      const appPath = action.ext.appPath

      return new Promise((resolve, reject) => {
        exec(`open "${appPath}"`, (error, stdout, stderr) => {
          if (error) {
            console.error('Failed to open app:', stderr)
            reject(error)
          } else {
            console.log('Opened app:', appPath)
            resolve()
          }
        })
      })
    }
  }
}

module.exports = new AppLauncherExtension()
