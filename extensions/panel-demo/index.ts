import { IExtension, IAction, IStore, IPanelController } from 'keyerext'

class PanelDemoExtension implements IExtension {
  store?: IStore
  panel?: IPanelController

  async onPrepare(): Promise<IAction[]> {
    console.log('Panel Demo Extension loaded')

    // 返回所有 panel demo 的 actions
    return [
      {
        id: 'com.keyer.panel-demo.dashboard',
        name: 'Dashboard Panel',
        desc: '演示 Dashboard 面板 - 卡片式布局',
        typeLabel: 'Panel',
        ext: {
          type: 'panel-demo',
          demo: 'dashboard'
        }
      }
    ]
  }

  async doAction(action: IAction): Promise<boolean> {
    console.log('Executing panel demo action:', action)
    if (!action.ext || action.ext.type !== 'panel-demo') {
      throw new Error('Not a panel-demo action')
    }

    if (!this.panel) {
      console.error('Panel controller not available')
      return false
    }

    switch (action.ext.demo) {
      case 'list':
        this.panel.showPanel({
          title: 'Simple List',
          component: 'SimpleList'
        })
        break

      case 'system-info':
        this.panel.showPanel({
          title: 'System Information',
          component: 'SystemInfo'
        })
        break

      case 'dashboard':
        this.panel.showPanel({
          title: 'System Dashboard',
          component: 'Dashboard',
          props: {
            title: 'My Custom Dashboard'
          }
        })
        break

      default:
        return false
    }

    // 显示面板后保持主面板打开
    return true
  }
}

export default new PanelDemoExtension()
