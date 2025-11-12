// UI Extension Loader - 在渲染进程中加载扩展的 UI 组件
import React from 'react'

interface UIExtensionModule {
  [componentName: string]: React.ComponentType<any>
}

class UIExtensionLoader {
  private extensions: Map<string, UIExtensionModule> = new Map()

  async loadExtension(extensionId: string, uiPath: string): Promise<void> {
    try {
      console.log(uiPath)
      // 主进程已经返回了完整的可用路径（开发环境是 /extensions/...，生产环境是 file://...）
      const module = await import(/* @vite-ignore */ uiPath)
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
