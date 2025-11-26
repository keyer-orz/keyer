import fs from 'node:fs/promises'
import path from 'node:path'

/**
 * 文件系统工具类 (渲染进程)
 * 由于 nodeIntegration: true, 可以直接使用 Node.js API
 */

/**
 * 读取目录
 */
export async function readDir(dirPath: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true })
    return entries
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name)
  } catch (error) {
    console.error('Error reading directory:', error)
    throw error
  }
}

/**
 * 读取文件
 */
export async function readFile(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, 'utf-8')
  } catch (error) {
    console.error('Error reading file:', error)
    throw error
  }
}

/**
 * 路径拼接
 */
export function joinPath(...paths: string[]): string {
  return path.join(...paths)
}

/**
 * 检查文件/目录是否存在
 */
export async function exists(path: string): Promise<boolean> {
  try {
    await fs.access(path)
    return true
  } catch {
    return false
  }
}

/**
 * 写入文件
 */
export async function writeFile(filePath: string, content: string): Promise<void> {
  try {
    await fs.writeFile(filePath, content, 'utf-8')
  } catch (error) {
    console.error('Error writing file:', error)
    throw error
  }
}

/**
 * 创建目录
 */
export async function mkdir(dirPath: string, recursive = true): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive })
  } catch (error) {
    console.error('Error creating directory:', error)
    throw error
  }
}
