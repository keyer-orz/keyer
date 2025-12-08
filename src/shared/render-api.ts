import { IRenderAPI } from "keyerext";
import { Command } from "./extension"

export interface ExtensionPackageInfo {
  name: string
  title?: string
  desc?: string
  icon?: string
  version?: string
  main: string
  dir: string
  commands?: Command[]
}

export interface ExtensionCreateOptions {
  name: string
  title: string
  desc: string
  targetDir: string
}

export interface ExtensionValidateResult {
  valid: boolean
  error?: string
  info?: ExtensionPackageInfo
}

export interface ExtensionDownloadOptions {
  onProgress?: (downloaded: number, total: number, progress: number) => void
}

export interface _IRenderAPI extends IRenderAPI {
  extensions: {
    scan: () => Promise<ExtensionPackageInfo[]>
    create: (options: ExtensionCreateOptions) => Promise<void>
    validateExtension: (path: string) => Promise<ExtensionValidateResult>
    installUserExtension: (path: string) => Promise<boolean>
    uninstallUserExtension: (name: string) => Promise<boolean>
    downloadAndInstall: (url: string, name: string, options?: ExtensionDownloadOptions) => Promise<boolean>
  }
}
