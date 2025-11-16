/**
 * IPC 插件商店处理器
 */
import { ipcMain, app, dialog } from 'electron'
import { exec } from 'child_process'
import { promisify } from 'util'
import * as path from 'path'
import * as fs from 'fs'

const execAsync = promisify(exec)

interface StorePlugin {
  icon?: string
  name: string
  title: string
  desc?: string
  version?: string
  repo: string
}

/**
 * 安装插件到用户目录
 */
export function setupStoreIPCHandlers() {
  ipcMain.handle('store:install-plugin', async (_event, plugin: StorePlugin) => {
    if (!plugin || !plugin.repo || !plugin.name) {
      throw new Error('Invalid plugin data')
    }

    try {
      // 获取用户插件安装目录
      const userDataPath = app.getPath('userData')
      const extensionsDir = path.join(userDataPath, 'extensions')

      // 确保扩展目录存在
      if (!fs.existsSync(extensionsDir)) {
        fs.mkdirSync(extensionsDir, { recursive: true })
      }

      const pluginDir = path.join(extensionsDir, plugin.name)

      // 检查插件是否已安装
      if (fs.existsSync(pluginDir)) {
        const overwrite = await dialog.showMessageBox({
          type: 'question',
          buttons: ['Cancel', 'Overwrite'],
          defaultId: 0,
          title: 'Plugin Already Exists',
          message: `Plugin "${plugin.title}" is already installed. Do you want to overwrite it?`
        })

        if (overwrite.response === 0) {
          throw new Error('Installation cancelled by user')
        }

        // 删除旧版本
        fs.rmSync(pluginDir, { recursive: true, force: true })
      }

      console.log(`Installing plugin ${plugin.name} from ${plugin.repo}`)

      // 使用 git clone 下载插件
      const { stdout, stderr } = await execAsync(`git clone "${plugin.repo}" "${pluginDir}"`)

      if (stderr && !stderr.includes('Cloning into')) {
        console.warn('Git clone stderr:', stderr)
      }

      console.log('Git clone output:', stdout)

      // 检查是否有 package.json
      const packageJsonPath = path.join(pluginDir, 'package.json')
      if (!fs.existsSync(packageJsonPath)) {
        throw new Error('Plugin does not have a package.json file')
      }

      // 安装依赖
      console.log('Installing dependencies...')
      try {
        const { stdout: installOut, stderr: installErr } = await execAsync('npm install', {
          cwd: pluginDir
        })
        console.log('npm install output:', installOut)
        if (installErr) {
          console.warn('npm install stderr:', installErr)
        }
      } catch (npmError: any) {
        console.error('npm install error:', npmError)
        // 继续，即使依赖安装失败
      }

      // 构建插件（如果有 build 脚本）
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
      if (packageJson.scripts && packageJson.scripts.build) {
        console.log('Building plugin...')
        try {
          const { stdout: buildOut, stderr: buildErr } = await execAsync('npm run build', {
            cwd: pluginDir
          })
          console.log('npm build output:', buildOut)
          if (buildErr) {
            console.warn('npm build stderr:', buildErr)
          }
        } catch (buildError: any) {
          console.error('Build error:', buildError)
          throw new Error(`Failed to build plugin: ${buildError.message}`)
        }
      }

      console.log(`Plugin ${plugin.name} installed successfully`)

      // 显示成功对话框
      await dialog.showMessageBox({
        type: 'info',
        title: 'Installation Complete',
        message: `Plugin "${plugin.title}" has been installed successfully!`,
        detail: 'Please restart the application to load the new plugin.'
      })

      return { success: true, path: pluginDir }
    } catch (error: any) {
      console.error('Plugin installation failed:', error)
      throw new Error(`Failed to install plugin: ${error.message}`)
    }
  })

  // 卸载插件
  ipcMain.handle('store:uninstall-plugin', async (_event, pluginName: string) => {
    try {
      const userDataPath = app.getPath('userData')
      const pluginDir = path.join(userDataPath, 'extensions', pluginName)

      if (!fs.existsSync(pluginDir)) {
        throw new Error('Plugin not found')
      }

      // 确认删除
      const result = await dialog.showMessageBox({
        type: 'warning',
        buttons: ['Cancel', 'Uninstall'],
        defaultId: 0,
        title: 'Uninstall Plugin',
        message: `Are you sure you want to uninstall "${pluginName}"?`,
        detail: 'This action cannot be undone.'
      })

      if (result.response === 0) {
        throw new Error('Uninstall cancelled by user')
      }

      // 删除插件目录
      fs.rmSync(pluginDir, { recursive: true, force: true })

      console.log(`Plugin ${pluginName} uninstalled successfully`)

      await dialog.showMessageBox({
        type: 'info',
        title: 'Uninstall Complete',
        message: `Plugin "${pluginName}" has been uninstalled.`,
        detail: 'Please restart the application to apply changes.'
      })

      return { success: true }
    } catch (error: any) {
      console.error('Plugin uninstall failed:', error)
      throw new Error(`Failed to uninstall plugin: ${error.message}`)
    }
  })
}
