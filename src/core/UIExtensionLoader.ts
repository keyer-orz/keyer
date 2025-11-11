// UI Extension Loader - 在渲染进程中加载扩展的 UI 组件

interface UIExtensionModule {
  [componentName: string]: React.ComponentType<any>
}

class UIExtensionLoader {
  private extensions: Map<string, UIExtensionModule> = new Map()

  // 判断是否为开发环境
  private isDev(): boolean {
    // 检查是否通过 Vite 开发服务器加载
    return window.location.protocol === 'http:' || window.location.protocol === 'https:'
  }

  // 转换路径为适合当前环境的导入路径
  private getImportPath(uiPath: string): string {
    if (this.isDev()) {
      // 开发环境：使用相对路径，通过 Vite 服务器加载
      return uiPath
    } else {
      // 生产环境：使用自定义协议加载
      // 将 /extensions/... 转换为 ext-file://extensions/...
      return `ext-file://${uiPath.startsWith('/') ? uiPath.substring(1) : uiPath}`
    }
  }

  // 加载扩展的 UI 模块
  // @param extensionId - 扩展的唯一标识符
  // @param uiPath - 扩展 UI 文件的相对路径（相对于项目根目录），例如：/extensions/clipboard-history/dist/ui.js
  async loadExtension(extensionId: string, uiPath: string): Promise<void> {
    try {
      const importPath = this.getImportPath(uiPath)
      console.log(`Loading UI extension: ${extensionId}`)
      console.log(`  Original path: ${uiPath}`)
      console.log(`  Import path: ${importPath}`)
      console.log(`  Environment: ${this.isDev() ? 'development' : 'production'}`)

      // 动态导入扩展的 UI 模块
      const module = await import(/* @vite-ignore */ importPath)
      // 使用 default export
      this.extensions.set(extensionId, module.default || module)
      console.log(`Loaded UI extension: ${extensionId}`)
      console.log(`Available components:`, Object.keys(module.default || module))
    } catch (error) {
      console.error(`Failed to load UI extension ${extensionId}:`, error)
    }
  }

  // 获取组件
  getComponent(extensionId: string, componentName: string): React.ComponentType<any> | null {
    console.log('getComponent called:', { extensionId, componentName })

    const extension = this.extensions.get(extensionId)
    console.log('Extension lookup result:', extension)
    console.log('Extension keys:', extension ? Object.keys(extension) : 'none')
    console.log('All loaded extensions:', Array.from(this.extensions.keys()))

    if (!extension) {
      console.error(`Extension ${extensionId} not found`)
      return null
    }

    const component = extension[componentName]
    console.log('Component lookup result:', component)
    console.log('Component type:', typeof component)

    if (!component) {
      console.error(`Component ${componentName} not found in extension ${extensionId}`)
      console.error('Available components in extension:', Object.keys(extension))
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
