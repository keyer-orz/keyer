// UI Extension Loader - 在渲染进程中加载扩展的 UI 组件
import React from 'react'

interface UIExtensionModule {
  [componentName: string]: React.ComponentType<any>
}

class UIExtensionLoader {
  private extensions: Map<string, UIExtensionModule> = new Map()

  // 统一路径生成：开发环境用 /extensions/{id}/dist/ui.js，生产环境用 file://${resourcesPath}/extensions/{id}/dist/ui.js
  private getImportPath(extensionId: string): string {
    const isDev = window.location.protocol === 'http:' || window.location.protocol === 'https:'
    if (isDev) {
      return `/extensions/${extensionId}/dist/ui.js`
    } else {
      // @ts-ignore
      const resourcesPath = (window as any).process?.resourcesPath || ''
      return `file://${resourcesPath}/extensions/${extensionId}/dist/ui.js`
    }
  }

  async loadExtension(extensionId: string): Promise<void> {
    try {
      const importPath = this.getImportPath(extensionId)
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
