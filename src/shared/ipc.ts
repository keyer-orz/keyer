export interface ExtensionPackageInfo {
  name: string
  title?: string
  desc?: string
  icon?: string
  version?: string
  main: string
  dir: string
  commands?: Array<{
    name: string
    title?: string
    desc?: string
    icon?: string
    type?: string
  }>
}

export interface ExecResult {
  success: boolean
  output?: string
  error?: string
}

export interface ExtensionCreateOptions {
  name: string
  title: string
  desc: string
  targetDir: string
}

export type APIType = {
  app: {
    getVersion: () => Promise<string>
    getName: () => Promise<string>
    /**
     * 获取应用图标（返回 base64 PNG）
     */
    getFileIcon: (appPath: string) => Promise<string>
  }
  file: {
    read: (path: string) => Promise<string>
    write: (path: string, content: string) => Promise<void>
    selectDirectory: () => Promise<string | undefined>
  }
  window: {
    show: () => Promise<void>
    hide: () => Promise<void>
    resize: (size: { width: number; height: number }) => Promise<void>
  }
  extensions: {
    scan: () => Promise<ExtensionPackageInfo[]>
    create: (options: ExtensionCreateOptions) => Promise<void>
  }
  shortcuts: {
    updateGlobal: (shortcut: string) => Promise<boolean>
    updateCommand: (cmdId: string, shortcut: string | undefined) => Promise<boolean>
  }
  exec: {
    terminal: (cmd: string, cwd?: string) => Promise<ExecResult>
    window: (cmd: string) => Promise<ExecResult>
  }
}