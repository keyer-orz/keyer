import { IMainAPI } from "keyerext";
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

export interface IExtensionsAPI {
  scan: () => Promise<ExtensionPackageInfo[]>
  create: (options: ExtensionCreateOptions) => Promise<void>
  validateExtension: (path: string) => Promise<ExtensionValidateResult>
  installUserExtension: (path: string) => Promise<boolean>
  uninstallUserExtension: (name: string) => Promise<boolean>
  downloadAndInstall: (url: string, name: string) => Promise<boolean>
  getInstalledExtensions: () => Promise<ExtensionPackageInfo[]>
}

export interface _IMainAPI extends IMainAPI {
    extensions: IExtensionsAPI
}
