# List 和 Item 组件使用指南

Keyer 扩展 SDK 提供了 `List` 和 `Item` 组件，用于快速构建支持键盘导航的列表界面。

## 功能特性

- ✅ 键盘导航（↑ ↓ 方向键）
- ✅ 回车键选择
- ✅ Esc 键取消
- ✅ 鼠标悬停选择
- ✅ 自动滚动到选中项
- ✅ 支持自定义渲染

## 安装

List 和 Item 组件已包含在 `keyerext` 包中：

```typescript
import { List, Item } from 'keyerext'
import type { ListItem } from 'keyerext'
```

## 基础用法

### 使用 Item 组件（推荐）

```tsx
import { List, Item } from 'keyerext'
import type { ListItem } from 'keyerext'

interface MyData {
  title: string
  description: string
}

function MyComponent({ onClose }: { onClose: () => void }) {
  const items: ListItem<MyData>[] = [
    {
      id: '1',
      data: { title: 'Item 1', description: 'Description 1' }
    },
    {
      id: '2',
      data: { title: 'Item 2', description: 'Description 2' }
    }
  ]

  return (
    <List
      items={items}
      onEnter={(item) => {
        console.log('Selected:', item.data)
        onClose()
      }}
      onEscape={onClose}
      renderItem={(item, index, isSelected) => (
        <Item
          icon="📄"
          title={item.data.title}
          description={item.data.description}
          badge="New"
        />
      )}
    />
  )
}
```

### 自定义渲染

```tsx
<List
  items={items}
  onEnter={(item) => handleSelect(item)}
  onEscape={onClose}
  renderItem={(item, index, isSelected) => (
    <div style={{
      padding: '12px',
      backgroundColor: isSelected ? '#e3f2fd' : 'transparent'
    }}>
      <h3>{item.data.title}</h3>
      <p>{item.data.description}</p>
    </div>
  )}
/>
```

## API

### List Props

| 属性 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `items` | `ListItem<T>[]` | ✅ | - | 列表数据 |
| `renderItem` | `(item, index, isSelected) => ReactNode` | ✅ | - | 渲染函数 |
| `onEnter` | `(item, index) => void` | ❌ | - | 回车键回调 |
| `onEscape` | `() => void` | ❌ | - | Esc 键回调 |
| `onSelect` | `(item, index) => void` | ❌ | - | 选中项变化回调 |
| `className` | `string` | ❌ | `''` | 容器类名 |
| `selectedClassName` | `string` | ❌ | `'selected'` | 选中项类名 |
| `autoFocus` | `boolean` | ❌ | `true` | 是否自动聚焦 |
| `initialSelectedIndex` | `number` | ❌ | `0` | 初始选中索引 |

### ListItem Type

```typescript
interface ListItem<T = any> {
  id: string | number  // 唯一标识
  data: T              // 数据
}
```

### Item Props

| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `icon` | `ReactNode` | ❌ | 图标（emoji 或组件） |
| `title` | `string` | ✅ | 标题 |
| `description` | `string` | ❌ | 描述文本 |
| `badge` | `string` | ❌ | 徽章文本 |
| `className` | `string` | ❌ | 自定义类名 |
| `children` | `ReactNode` | ❌ | 自定义子内容 |

## 样式定制

### 使用内置 CSS

```tsx
import 'keyerext/dist/components/List.css'
```

### 自定义样式

```css
/* 覆盖默认样式 */
.keyer-list-item.selected {
  background-color: #your-color;
}

.keyer-item-title {
  font-size: 16px;
  color: #your-color;
}
```

## 完整示例

参见 `extensions/clipboard-history/index.tsx` 中的使用示例。

## 键盘快捷键

- **↑ / ↓**: 上下导航
- **Enter**: 选择当前项
- **Esc**: 取消/关闭
- **鼠标悬停**: 选中项目

## 最佳实践

1. **总是提供 `onEscape` 回调**，让用户可以关闭界面
2. **使用 `Item` 组件**以保持一致的视觉样式
3. **数据较多时考虑虚拟化**（将来支持）
4. **使用有意义的 `id`**，避免使用数组索引
