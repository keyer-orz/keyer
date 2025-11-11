import { IExtension, IActionDef, IStore, IPanelController } from 'keyerext'

class PanelDemoExtension implements IExtension {
  store?: IStore
  panel?: IPanelController

  async onPrepare(): Promise<IActionDef[]> {
    console.log('Panel Demo Extension loaded')

    // 返回所有 panel demo 的 actions
    return [
      {
        key: 'dashboard-panel',
        name: 'Dashboard Panel',
        desc: '演示 Dashboard 面板 - 卡片式布局',
        typeLabel: 'Panel'
      },
      {
        key: 'simple-list',
        name: 'Simple List',
        desc: '演示简单列表面板',
        typeLabel: 'Panel'
      },
      {
        key: 'system-info',
        name: 'System Info',
        desc: '演示系统信息面板',
        typeLabel: 'Panel'
      }
    ]
  }

  async doAction(key: string): Promise<boolean> {
    console.log('Executing panel demo action:', key)

    if (!this.panel) {
      console.error('Panel controller not available')
      return false
    }

    // 根据 key 判断显示哪个面板
    switch (key) {
      case 'dashboard-panel':
        this.panel.showPanel({
          title: 'System Dashboard',
          component: 'Dashboard',
          props: {
            title: 'My Custom Dashboard'
          }
        })
        break

      case 'simple-list':
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

      default:
        console.error(`Unknown action key: ${key}`)
        return false
    }

    // 显示面板后保持主面板打开
    return true
  }
}

export default new PanelDemoExtension()
