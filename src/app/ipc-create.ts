import { ipcMain, dialog, shell, app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import { getMainWindow } from './window'

/**
 * 插件元数据
 */
interface PluginMetadata {
    icon: string
    name: string
    title: string
    desc: string
}

/**
 * 设置创建插件相关的 IPC 处理器
 */
export function setupCreateIPCHandlers() {
    // 选择目录
    ipcMain.handle('create:select-directory', async () => {
        const mainWindow = getMainWindow()
        if (!mainWindow) {
            return null
        }

        const result = await dialog.showOpenDialog(mainWindow, {
            properties: ['openDirectory', 'createDirectory'],
            title: 'Select Plugin Location',
            buttonLabel: 'Select'
        })

        if (result.canceled || result.filePaths.length === 0) {
            return null
        }

        return result.filePaths[0]
    })

    // 生成插件
    ipcMain.handle('create:generate-plugin', async (_event, type: 'script' | 'extension', metadata: PluginMetadata, targetDir: string) => {
        try {
            // 获取模板目录
            const templateDir = getTemplateDir(type)

            // 验证模板目录是否存在
            if (!fs.existsSync(templateDir)) {
                throw new Error(`Template directory not found: ${templateDir}`)
            }

            // 创建目标插件目录
            const pluginDir = path.join(targetDir, metadata.name)

            // 检查目录是否已存在
            if (fs.existsSync(pluginDir)) {
                throw new Error(`Directory "${metadata.name}" already exists in the selected location`)
            }

            // 创建插件目录
            fs.mkdirSync(pluginDir, { recursive: true })

            // 复制并处理模板文件
            await copyTemplateFiles(templateDir, pluginDir, metadata, type)

            console.log(`Plugin created successfully at: ${pluginDir}`)

            return {
                success: true,
                path: pluginDir
            }
        } catch (error: any) {
            console.error('Failed to generate plugin:', error)
            throw new Error(`Failed to create plugin: ${error.message}`)
        }
    })

    // 打开 Finder
    ipcMain.handle('create:open-finder', async (_event, dirPath: string) => {
        try {
            await shell.openPath(dirPath)
        } catch (error) {
            console.error('Failed to open Finder:', error)
            throw new Error('Failed to open Finder')
        }
    })
}

/**
 * 获取模板目录路径
 * 开发环境：项目根目录/templates
 * 生产环境：Resources/templates
 */
function getTemplateDir(type: 'script' | 'extension'): string {
    if (app.isPackaged) {
        // 生产环境：从 Resources 目录读取
        return path.join(process.resourcesPath, 'templates', type)
    } else {
        // 开发环境：从项目根目录读取
        // app.getAppPath() 返回项目根目录（keyer/）
        return path.join(app.getAppPath(), 'templates', type)
    }
}

/**
 * 复制模板文件并替换变量
 */
async function copyTemplateFiles(
    templateDir: string,
    targetDir: string,
    metadata: PluginMetadata,
    type: 'script' | 'extension'
): Promise<void> {
    // 读取模板目录中的所有文件
    const entries = fs.readdirSync(templateDir, { withFileTypes: true })

    for (const entry of entries) {
        const sourcePath = path.join(templateDir, entry.name)
        const targetPath = path.join(targetDir, entry.name)

        // 跳过 node_modules 和 dist 目录
        if (entry.name === 'node_modules' || entry.name === 'dist') {
            continue
        }

        // 检查是否是符号链接，如果是则跳过
        try {
            const stats = fs.lstatSync(sourcePath)
            if (stats.isSymbolicLink()) {
                console.log(`Skipping symlink: ${sourcePath}`)
                continue
            }
        } catch (error) {
            console.warn(`Error checking file ${sourcePath}:`, error)
            continue
        }

        if (entry.isDirectory()) {
            // 递归复制目录
            fs.mkdirSync(targetPath, { recursive: true })
            await copyTemplateFiles(sourcePath, targetPath, metadata, type)
        } else {
            // 复制并处理文件
            try {
                let content = fs.readFileSync(sourcePath, 'utf-8')

                // 替换模板变量
                content = content
                    .replace(/\$\{icon\}/g, metadata.icon)
                    .replace(/\$\{name\}/g, metadata.name)
                    .replace(/\$\{title\}/g, metadata.title)
                    .replace(/\$\{desc\}/g, metadata.desc)

                // 写入目标文件
                fs.writeFileSync(targetPath, content, 'utf-8')
            } catch (error) {
                console.warn(`Error copying file ${sourcePath}:`, error)
            }
        }
    }

    // 如果是脚本类型，创建一个示例脚本文件
    if (type === 'script') {
        const scriptPath = path.join(targetDir, `${metadata.name}.sh`)
        const scriptContent = `#!/bin/bash
# @keyer.icon ${metadata.icon}
# @keyer.name ${metadata.name}
# @keyer.title ${metadata.title}
# @keyer.desc ${metadata.desc}

# Your script code here
echo "Hello from ${metadata.title}!"
`
        fs.writeFileSync(scriptPath, scriptContent, 'utf-8')
        // 设置脚本为可执行
        fs.chmodSync(scriptPath, 0o755)
    }
}
