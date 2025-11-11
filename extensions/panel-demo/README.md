# Panel Demo Extension

这是一个展示 Keyer Panel 系统功能的演示扩展。

## 功能

该扩展演示了两种类型的面板：

### 1. List Panel（列表面板）
- 显示带有图标、标题、副标题和附件的列表项
- 支持键盘导航（方向键、回车、ESC）
- 支持搜索过滤
- 每个列表项可以关联一个动作

### 2. Board Panel（卡片面板）
- 网格式卡片布局
- 每个卡片包含图标、标题、描述和元数据
- 支持键盘导航和搜索过滤
- 适合展示仪表板类型的信息

## 使用方法

1. 在 Keyer 主界面搜索 "panel" 或 "list" 或 "board"
2. 选择 "Panel List Demo" 查看列表面板
3. 选择 "Panel Board Demo" 查看卡片面板

## 实现细节

### List Panel 示例

```typescript
this.panel.showPanel({
  type: 'list',
  title: 'List Panel Demo',
  items: [
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
    // ... 更多项目
  ],
  placeholder: '搜索列表项...',
  onSearch: async (query: string) => {
    // 实现搜索逻辑
    return items.filter(item =>
      item.title.toLowerCase().includes(query.toLowerCase())
    )
  },
  onAction: async (item) => {
    // 处理项目点击
    console.log('Item clicked:', item)
  }
})
```

### Board Panel 示例

```typescript
this.panel.showPanel({
  type: 'board',
  title: 'Board Panel Demo',
  items: [
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
    // ... 更多卡片
  ],
  placeholder: '搜索卡片...',
  onSearch: async (query: string) => {
    // 实现搜索逻辑
    return items.filter(item =>
      item.title.toLowerCase().includes(query.toLowerCase())
    )
  },
  onAction: async (item) => {
    // 处理卡片点击
    console.log('Card clicked:', item)
  }
})
```

## API 参考

### IPanelConfig

```typescript
interface IPanelConfig {
  type: 'list' | 'board'                                    // 面板类型
  title: string                                             // 面板标题
  items: IListItem[] | IBoardItem[]                         // 面板项目
  placeholder?: string                                      // 搜索占位符
  onSearch?: (query: string) => Promise<IListItem[] | IBoardItem[]>  // 搜索回调
  onAction?: (item: IListItem | IBoardItem) => Promise<void>         // 点击回调
}
```

### IListItem

```typescript
interface IListItem {
  id: string              // 唯一标识
  title: string           // 标题
  subtitle?: string       // 副标题
  icon?: string           // 图标（emoji）
  accessories?: string[]  // 右侧附加信息
  action?: IAction        // 关联的动作
}
```

### IBoardItem

```typescript
interface IBoardItem {
  id: string                         // 唯一标识
  title: string                      // 标题
  description?: string               // 描述
  icon?: string                      // 图标（emoji）
  metadata?: Record<string, string>  // 元数据键值对
  action?: IAction                   // 关联的动作
}
```

### IPanelController

```typescript
interface IPanelController {
  showPanel(config: IPanelConfig): void           // 显示面板
  closePanel(): void                              // 关闭面板
  updatePanel(items: IListItem[] | IBoardItem[]): void  // 更新面板内容
}
```

## 键盘快捷键

- **↑/↓**: 上下选择
- **Enter**: 执行当前选中项
- **ESC**: 关闭面板
- **搜索框**: 输入内容实时过滤

## 主题支持

Panel 组件完全支持深色/浅色主题切换，会自动跟随应用主题。
