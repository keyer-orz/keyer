import { _ICommandAPI } from "@/app/keyer/command";
import { Command } from "@/app/managers/Extension";
import { CommandResult, IRenderAPI } from "keyerext";

export interface ExtensionPackageInfo {
  name: string
  title?: string
  desc?: string
  icon?: string
  version?: string
  main: string
  dir: string
  type?: "store" | "local" | "app" | "dev"
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
    validateExtension: (extPath: string) => Promise<ExtensionValidateResult>
    installUserExtension: (extPath: string) => Promise<boolean>
    uninstallUserExtension: (extPath: string) => Promise<boolean>
    install: (url: string, name: string, options?: ExtensionDownloadOptions) => Promise<boolean>
    uninstall: (name: string) => Promise<boolean>
  },
  command: IRenderAPI['command'] & _ICommandAPI
}
