// 渲染进程中的 PanelController（已废弃，保留作为占位符）
// 扩展现在通过 IExtensionResult 直接返回组件
export class RendererPanelController {
  setCurrentExtension(_extensionId: string) {
    // No-op: 扩展现在直接返回组件，不需要 panel controller
  }
}
