import { Command } from "./extension"
import type { IMainAPI, ExecResult } from '../../keyerext/src/keyer'

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

export type { ExecResult }

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

export interface IAppAPI {
  getVersion: () => Promise<string>
  getName: () => Promise<string>
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

export interface APIType extends IMainAPI {
  app: IAppAPI
  extensions: IExtensionsAPI
}