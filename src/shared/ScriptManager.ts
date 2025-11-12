import * as fs from 'fs'
import * as path from 'path'
import { ICommand } from './types'

export class ScriptManager {
  private commands: Map<string, ICommand> = new Map()
  private scriptsDir: string

  constructor(scriptsDir: string) {
    this.scriptsDir = scriptsDir
  }

  // 扫描并注册所有 script
  async scanScripts(): Promise<void> {
    console.log('Scanning scripts directory:', this.scriptsDir)

    if (!fs.existsSync(this.scriptsDir)) {
      console.log('Scripts directory not found, creating:', this.scriptsDir)
      fs.mkdirSync(this.scriptsDir, { recursive: true })
      return
    }

    const files = fs.readdirSync(this.scriptsDir)
    console.log('Found files in scripts directory:', files)

    for (const file of files) {
      const filePath = path.join(this.scriptsDir, file)
      const stat = fs.statSync(filePath)

      if (stat.isFile() && (file.endsWith('.sh') || file.endsWith('.js') || file.endsWith('.py'))) {
        console.log('Parsing script file:', filePath)
        await this.parseScriptFile(filePath)
      }
    }

    console.log(`Loaded ${this.commands.size} script commands`)
    console.log('Script commands:', Array.from(this.commands.values()))
  }

  // 解析 script 文件，提取命令信息
  private async parseScriptFile(filePath: string): Promise<void> {
    const content = fs.readFileSync(filePath, 'utf-8')
    const lines = content.split('\n')

    let id: string | null = null
    let key: string | null = null
    let name: string | null = null
    let desc: string | null = null

    // 解析注释中的 @keyer 标记
    for (const line of lines) {
      const trimmed = line.trim()

      // 匹配 # @keyer.xxx 或 // @keyer.xxx
      const idMatch = trimmed.match(/^[#/]+\s*@keyer\.id\s+(.+)/)
      const keyMatch = trimmed.match(/^[#/]+\s*@keyer\.key\s+(.+)/)
      const nameMatch = trimmed.match(/^[#/]+\s*@keyer\.name\s+(.+)/)
      const descMatch = trimmed.match(/^[#/]+\s*@keyer\.desc\s+(.+)/)

      if (idMatch) id = idMatch[1].trim()
      if (keyMatch) key = keyMatch[1].trim()
      if (nameMatch) name = nameMatch[1].trim()
      if (descMatch) desc = descMatch[1].trim()

      // 如果已经找到所有信息，可以提前退出
      if (id && name && desc) {
        break
      }
    }

    // 如果找到了完整的命令信息，则注册
    // 如果没有指定 key，使用 id 作为 key
    if (id && name && desc) {
      this.commands.set(id, {
        id,
        key: key || id,
        name,
        desc,
      })
      console.log(`Registered script command: ${id} - ${name}`)
    }
  }

  // 获取所有命令
  getCommands(): ICommand[] {
    return Array.from(this.commands.values())
  }

  // 根据 ID 获取命令
  getCommand(id: string): ICommand | undefined {
    return this.commands.get(id)
  }

  // 执行 script 命令
  async executeScript(commandId: string): Promise<void> {
    const command = this.commands.get(commandId)
    if (!command) {
      throw new Error(`Script command not found: ${commandId}`)
    }

    // 在 scripts 目录中查找对应的脚本文件
    const files = fs.readdirSync(this.scriptsDir)
    let scriptFile: string | null = null

    for (const file of files) {
      const filePath = path.join(this.scriptsDir, file)
      const content = fs.readFileSync(filePath, 'utf-8')

      if (content.includes(`@keyer.id ${commandId}`)) {
        scriptFile = filePath
        break
      }
    }

    if (!scriptFile) {
      throw new Error(`Script file not found for command: ${commandId}`)
    }

    // 根据文件扩展名执行脚本
    const { exec } = require('child_process')
    const ext = path.extname(scriptFile)

    let execCommand = ''
    if (ext === '.sh') {
      execCommand = `bash "${scriptFile}"`
    } else if (ext === '.js') {
      execCommand = `node "${scriptFile}"`
    } else if (ext === '.py') {
      execCommand = `python3 "${scriptFile}"`
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
}
