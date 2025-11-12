import { IPanelController, IPanelConfig } from 'keyerext'

// 渲染进程中的 PanelController
// 使用 CustomEvent 来通知 React 组件
export class RendererPanelController implements IPanelController {
  private currentExtensionId: string | null = null

  setCurrentExtension(extensionId: string) {
    this.currentExtensionId = extensionId
  }

  showPanel(config: IPanelConfig): void {
    // 发送可序列化的配置到 React 应用
    const serializableConfig = {
      title: config.title,
      component: config.component,
      extensionId: this.currentExtensionId,
      props: config.props
    }

    window.dispatchEvent(new CustomEvent('show-panel', {
      detail: serializableConfig
    }))
  }

  closePanel(): void {
    window.dispatchEvent(new CustomEvent('close-panel'))
  }

  updatePanel(props: Record<string, any>): void {
    window.dispatchEvent(new CustomEvent('update-panel', {
      detail: props
    }))
  }
}
