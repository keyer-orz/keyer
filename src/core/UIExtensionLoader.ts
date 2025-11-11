// UI Extension Loader - 在渲染进程中加载扩展的 UI 组件
import React from 'react'

interface UIExtensionModule {
  [componentName: string]: React.ComponentType<any>
}

class UIExtensionLoader {
  private extensions: Map<string, UIExtensionModule> = new Map()

  // 直接使用传入的路径（开发环境和生产环境的路径已在主进程处理好）
  private getImportPath(uiPath: string): string {
    const isDev = window.location.protocol === 'http:' || window.location.protocol === 'https:'
    if (isDev) {
      // 开发环境：直接使用传入的路径（如 /extensions/panel-demo/dist/ui.js）
      return uiPath
    } else {
      // 生产环境：使用 file:// 协议
      // @ts-ignore
      const resourcesPath = (window as any).process?.resourcesPath || ''
      return `file://${resourcesPath}${uiPath}`
    }
  }

  async loadExtension(extensionId: string, uiPath: string): Promise<void> {
    try {
      const importPath = this.getImportPath(uiPath)
      const module = await import(/* @vite-ignore */ importPath)
      this.extensions.set(extensionId, module.default || module)
    } catch (error) {
      throw new Error(`Failed to load UI extension ${extensionId}: ${error}`)
    }
  }

  getComponent(extensionId: string, componentName: string): React.ComponentType<any> | null {
    const extension = this.extensions.get(extensionId)
    return extension?.[componentName] ?? null
  }

  getLoadedExtensions(): string[] {
    return Array.from(this.extensions.keys())
  }
}

export const uiExtensionLoader = new UIExtensionLoader()
