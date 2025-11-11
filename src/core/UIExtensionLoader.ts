// UI Extension Loader - 在渲染进程中加载扩展的 UI 组件

interface UIExtensionModule {
  [componentName: string]: React.ComponentType<any>
}

class UIExtensionLoader {
  private extensions: Map<string, UIExtensionModule> = new Map()

  // 加载扩展的 UI 模块
  async loadExtension(extensionId: string, uiPath: string): Promise<void> {
    try {
      // 动态导入扩展的 UI 模块
      const module = await import(/* @vite-ignore */ uiPath)
      this.extensions.set(extensionId, module)
      console.log(`Loaded UI extension: ${extensionId} from ${uiPath}`)
    } catch (error) {
      console.error(`Failed to load UI extension ${extensionId}:`, error)
    }
  }

  // 获取组件
  getComponent(extensionId: string, componentName: string): React.ComponentType<any> | null {
    const extension = this.extensions.get(extensionId)
    if (!extension) {
      console.error(`Extension ${extensionId} not found`)
      return null
    }

    const component = extension[componentName]
    if (!component) {
      console.error(`Component ${componentName} not found in extension ${extensionId}`)
      return null
    }

    return component
  }

  // 获取所有已加载的扩展
  getLoadedExtensions(): string[] {
    return Array.from(this.extensions.keys())
  }
}

export const uiExtensionLoader = new UIExtensionLoader()
