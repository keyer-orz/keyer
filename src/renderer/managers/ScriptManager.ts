import * as fs from 'fs'
import * as path from 'path'
import { ICommand } from '../types'

// 脚本来源类型
type ScriptSource = 'dev' | 'mine' | 'sandbox'

// 脚本信息
interface ScriptInfo {
  ucid: string        // @script#script.name
  icon?: string
  name: string
  title: string
  desc: string
  type: string        // 默认为 Script
  filePath: string
  source: ScriptSource
}

export class ScriptManager {
  private scripts: Map<string, ScriptInfo> = new Map()  // key: ucid
  private commands: Map<string, ICommand> = new Map()   // key: ucid

  private devDir?: string  // 开发环境目录
  private mineDirs: string[] = []  // 本地路径目录列表
  private sandboxDir?: string  // 沙箱目录

  constructor(config: {
    devDir?: string
    mineDirs?: string[]
    sandboxDir?: string
  }) {
    this.devDir = config.devDir
    this.mineDirs = Array.isArray(config.mineDirs) ? config.mineDirs : []
    this.sandboxDir = config.sandboxDir
    console.log('ScriptManager initialized:', { devDir: this.devDir, mineDirs: this.mineDirs, sandboxDir: this.sandboxDir })
  }

  // 扫描并注册所有 script
  // 按照优先级：开发环境 > 本地路径 > 沙箱
  async scanScripts(): Promise<void> {
    const scriptMap = new Map<string, { path: string; source: ScriptSource }>()

    // 1. 沙箱（最低优先级）
    if (this.sandboxDir) {
      const sandboxScripts = await this.scanDirectory(this.sandboxDir, 'sandbox')
      for (const script of sandboxScripts) {
        scriptMap.set(script.name, { path: script.path, source: 'sandbox' })
      }
    }

    // 2. 本地路径（中等优先级）
    for (const mineDir of this.mineDirs) {
      const mineScripts = await this.scanDirectory(mineDir, 'mine')
      for (const script of mineScripts) {
        scriptMap.set(script.name, { path: script.path, source: 'mine' })
      }
    }

    // 3. 开发环境（最高优先级）
    if (this.devDir) {
      const devScripts = await this.scanDirectory(this.devDir, 'dev')
      for (const script of devScripts) {
        scriptMap.set(script.name, { path: script.path, source: 'dev' })
      }
    }

    // 解析所有脚本
    for (const [, info] of scriptMap) {
      await this.parseScriptFile(info.path, info.source)
    }

    console.log(`Loaded ${this.scripts.size} script commands`)
  }

  // 扫描目录，返回脚本列表
  private async scanDirectory(dir: string, source: ScriptSource): Promise<Array<{ name: string; path: string }>> {
    const result: Array<{ name: string; path: string }> = []

    if (!fs.existsSync(dir)) {
      if (source === 'sandbox') {
        // 创建沙箱目录
        fs.mkdirSync(dir, { recursive: true })
      }
      return result
    }

    const scanDir = (currentDir: string) => {
      const entries = fs.readdirSync(currentDir)

      for (const entry of entries) {
        const entryPath = path.join(currentDir, entry)
        const stat = fs.statSync(entryPath)

        if (stat.isDirectory()) {
          // 递归扫描子目录
          scanDir(entryPath)
        } else if (stat.isFile() && this.isScriptFile(entry)) {
          // 从文件中快速读取 name
          const content = fs.readFileSync(entryPath, 'utf-8')
          const nameMatch = content.match(/^[#/]+\s*@keyer\.name\s+(.+)/m)
          if (nameMatch) {
            const name = nameMatch[1].trim()
            result.push({ name, path: entryPath })
          }
        }
      }
    }

    scanDir(dir)
    return result
  }

  // 判断是否是脚本文件
  private isScriptFile(filename: string): boolean {
    return filename.endsWith('.sh') || filename.endsWith('.js') || filename.endsWith('.py')
  }

  // 解析 script 文件，提取命令信息
  private async parseScriptFile(filePath: string, source: ScriptSource): Promise<void> {
    const content = fs.readFileSync(filePath, 'utf-8')
    const lines = content.split('\n')

    let icon: string | undefined = undefined
    let name: string | null = null
    let title: string | null = null
    let desc: string | null = null
    let type: string = 'Script'

    // 解析注释中的 @keyer 标记
    for (const line of lines) {
      const trimmed = line.trim()

      // 匹配 # @keyer.xxx 或 // @keyer.xxx
      const iconMatch = trimmed.match(/^[#/]+\s*@keyer\.icon\s+(.+)/)
      const nameMatch = trimmed.match(/^[#/]+\s*@keyer\.name\s+(.+)/)
      const titleMatch = trimmed.match(/^[#/]+\s*@keyer\.title\s+(.+)/)
      const descMatch = trimmed.match(/^[#/]+\s*@keyer\.desc\s+(.+)/)
      const typeMatch = trimmed.match(/^[#/]+\s*@keyer\.type\s+(.+)/)

      if (iconMatch) icon = iconMatch[1].trim()
      if (nameMatch) name = nameMatch[1].trim()
      if (titleMatch) title = titleMatch[1].trim()
      if (descMatch) desc = descMatch[1].trim()
      if (typeMatch) type = typeMatch[1].trim()

      // 如果已经找到所有必要信息，可以提前退出
      if (name && title && desc) {
        break
      }
    }

    // 如果找到了完整的命令信息，则注册
    if (name && title && desc) {
      // 生成 UCID: @script#script.name
      const ucid = `@script#${name}`

      const scriptInfo: ScriptInfo = {
        ucid,
        icon,
        name,
        title,
        desc,
        type,
        filePath,
        source
      }

      this.scripts.set(ucid, scriptInfo)

      const command: ICommand = {
        ucid,
        icon,
        name,
        title,
        desc,
        type,
        source
      }

      this.commands.set(ucid, command)
      console.log(`Registered script (${source}): ${ucid} - ${title}`)
    } else {
      console.warn(`Incomplete script metadata in ${filePath}`)
    }
  }

  // 获取所有命令
  getCommands(): ICommand[] {
    return Array.from(this.commands.values())
  }

  // 根据 UCID 获取命令
  getCommand(ucid: string): ICommand | undefined {
    return this.commands.get(ucid)
  }

  // 执行 script 命令
  async executeScript(ucid: string): Promise<void> {
    const scriptInfo = this.scripts.get(ucid)
    if (!scriptInfo) {
      throw new Error(`Script command not found: ${ucid}`)
    }

    // 根据文件扩展名执行脚本
    const { exec } = require('child_process')
    const ext = path.extname(scriptInfo.filePath)

    let execCommand = ''
    if (ext === '.sh') {
      execCommand = `bash "${scriptInfo.filePath}"`
    } else if (ext === '.js') {
      execCommand = `node "${scriptInfo.filePath}"`
    } else if (ext === '.py') {
      execCommand = `python3 "${scriptInfo.filePath}"`
    } else {
      throw new Error(`Unsupported script type: ${ext}`)
    }

    return new Promise((resolve, reject) => {
      exec(execCommand, (error: any, stdout: string, stderr: string) => {
        if (error) {
          console.error(`Script execution error: ${stderr}`)
          reject(error)
        } else {
          console.log(`Script output: ${stdout}`)
          resolve()
        }
      })
    })
  }

  // 获取所有脚本信息
  getAllScripts() {
    return Array.from(this.scripts.values())
  }
}
