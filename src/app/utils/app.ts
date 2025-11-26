import packageJson from '../../../package.json'

/**
 * 应用信息工具类 (渲染进程)
 */

/**
 * 获取应用版本
 * 直接从 package.json 读取,无需通过 IPC 调用主进程
 */
export function getAppVersion(): string {
  return packageJson.version
}

/**
 * 获取应用名称
 */
export function getAppName(): string {
  return packageJson.name
}

/**
 * 获取应用描述
 */
export function getAppDescription(): string {
  return packageJson.description || ''
}

/**
 * 获取应用信息
 */
export function getAppInfo() {
  return {
    name: getAppName(),
    version: getAppVersion(),
    description: getAppDescription()
  }
}
