import { IExtension, IAction, IStore, IPanelController, IListItem, IBoardItem } from 'keyerext'

class PanelDemoExtension implements IExtension {
  store?: IStore
  panel?: IPanelController

  async onPrepare(): Promise<IAction[]> {
    console.log('Panel Demo Extension loaded')

    // 返回所有 panel demo 的 actions
    return [
      {
        id: 'com.keyer.panel-demo.list',
        name: 'Panel List Demo',
        desc: '演示 List 类型面板 - 展示带图标、副标题和附件的列表',
        typeLabel: 'Panel',
        ext: {
          type: 'panel-demo',
          panelType: 'list'
        }
      },
      {
        id: 'com.keyer.panel-demo.board',
        name: 'Panel Board Demo',
        desc: '演示 Board 类型面板 - 展示卡片式网格布局',
        typeLabel: 'Panel',
        ext: {
          type: 'panel-demo',
          panelType: 'board'
        }
      }
    ]
  }

  async doAction(action: IAction): Promise<void> {
    if (!action.ext || action.ext.type !== 'panel-demo') {
      throw new Error('Not a panel-demo action')
    }

    if (action.ext.panelType === 'list') {
      this.showListPanel()
    } else if (action.ext.panelType === 'board') {
      this.showBoardPanel()
    }
  }

  private showListPanel(): void {
    if (!this.panel) {
      console.error('Panel controller not available')
      return
    }

    const items: IListItem[] = [
      {
        id: '1',
        title: '项目文档',
        subtitle: '查看完整的项目文档和API参考',
        icon: '📄',
        accessories: ['Cmd+D'],
        action: {
          id: 'com.keyer.panel-demo.action.docs',
          name: '打开文档',
          desc: '打开项目文档'
        }
      },
      {
        id: '2',
        title: '设置',
        subtitle: '配置应用程序设置和偏好',
        icon: '⚙️',
        accessories: ['Cmd+,'],
        action: {
          id: 'com.keyer.panel-demo.action.settings',
          name: '打开设置',
          desc: '打开设置面板'
        }
      },
      {
        id: '3',
        title: '帮助中心',
        subtitle: '获取帮助和支持',
        icon: '❓',
        accessories: ['Cmd+?'],
        action: {
          id: 'com.keyer.panel-demo.action.help',
          name: '打开帮助',
          desc: '打开帮助中心'
        }
      },
      {
        id: '4',
        title: '关于',
        subtitle: 'Keyer v1.0.0 - 强大的应用启动器',
        icon: 'ℹ️',
        accessories: ['版本 1.0.0']
      },
      {
        id: '5',
        title: '反馈',
        subtitle: '报告问题或提出建议',
        icon: '💬',
        accessories: ['在线']
      }
    ]

    this.panel.showPanel({
      type: 'list',
      title: 'List Panel Demo',
      items,
      placeholder: '搜索列表项...',
      onSearch: async (query: string) => {
        // 搜索过滤
        return items.filter(item =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          (item.subtitle && item.subtitle.toLowerCase().includes(query.toLowerCase()))
        )
      },
      onAction: async (item: IListItem | IBoardItem) => {
        console.log('List item clicked:', item)
        // 可以在这里执行具体的操作
        if (item.action) {
          console.log('Executing action:', item.action)
        }
      }
    })
  }

  private showBoardPanel(): void {
    if (!this.panel) {
      console.error('Panel controller not available')
      return
    }

    const items: IBoardItem[] = [
      {
        id: '1',
        title: '系统监控',
        description: '实时查看系统资源使用情况',
        icon: '📊',
        metadata: {
          'CPU': '23%',
          '内存': '8.2 GB',
          '磁盘': '45%'
        }
      },
      {
        id: '2',
        title: '网络状态',
        description: '检查网络连接和速度',
        icon: '🌐',
        metadata: {
          '状态': '已连接',
          '速度': '100 Mbps',
          '延迟': '12ms'
        }
      },
      {
        id: '3',
        title: '电池状态',
        description: '查看电池健康和充电状态',
        icon: '🔋',
        metadata: {
          '电量': '87%',
          '状态': '正常',
          '健康度': '96%'
        }
      },
      {
        id: '4',
        title: '存储空间',
        description: '管理磁盘空间和文件',
        icon: '💾',
        metadata: {
          '已用': '256 GB',
          '可用': '256 GB',
          '总计': '512 GB'
        }
      },
      {
        id: '5',
        title: '温度监控',
        description: '监控系统温度',
        icon: '🌡️',
        metadata: {
          'CPU': '45°C',
          'GPU': '38°C',
          '风扇': '2500 RPM'
        }
      },
      {
        id: '6',
        title: '进程管理',
        description: '查看和管理运行中的进程',
        icon: '⚡',
        metadata: {
          '进程数': '342',
          '线程数': '1856',
          '活跃': '125'
        }
      }
    ]

    this.panel.showPanel({
      type: 'board',
      title: 'Board Panel Demo',
      items,
      placeholder: '搜索卡片...',
      onSearch: async (query: string) => {
        return items.filter(item =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          (item.description && item.description.toLowerCase().includes(query.toLowerCase()))
        )
      },
      onAction: async (item: IListItem | IBoardItem) => {
        console.log('Board item clicked:', item)
      }
    })
  }
}

export default new PanelDemoExtension()
