# Keyer UI Components 使用指南

## 组件列表

### Text - 文本组件
显示文本内容，支持不同颜色和字体大小。

```tsx
import { Text } from 'keyerext'

// 标题文本（大）
<Text color="title" size="large">这是大标题</Text>

// 副标题文本（中）
<Text color="subtitle" size="medium">这是副标题</Text>

// 小文本
<Text color="subtitle" size="small">这是小文本</Text>
```

### List - 列表组件
支持分组、键盘导航、选中和双击回调的列表组件。

```tsx
import { List } from 'keyerext'

const groups = [
  {
    title: "最近使用",
    items: [
      { id: "1", content: <Text>项目 1</Text> },
      { id: "2", content: <Text>项目 2</Text> }
    ]
  },
  {
    title: "其他",
    items: [
      { id: "3", content: <Text>项目 3</Text> }
    ]
  }
]

<List
  groups={groups}
  selectedId={selectedId}
  onSelect={(id) => console.log('选中:', id)}
  onDoubleClick={(id) => console.log('双击:', id)}
/>

// 键盘操作：
// - 上/下箭头: 选择上一项/下一项
// - Enter: 触发双击回调
```

### HStack / VStack - 栈布局
横向和纵向布局容器。

```tsx
import { HStack, VStack, Text } from 'keyerext'

// 横向布局
<HStack spacing={16}>
  <Text>左边</Text>
  <Text>右边</Text>
</HStack>

// 纵向布局
<VStack spacing={12}>
  <Text>上面</Text>
  <Text>下面</Text>
</VStack>
```

### Input - 输入框
带底部边框的输入框组件。

```tsx
import { Input } from 'keyerext'

<Input
  value={value}
  placeholder="请输入..."
  onChange={(val) => setValue(val)}
  onEnter={(val) => console.log('按下回车:', val)}
  autoFocus={true}
/>
```

### Divider - 分割线
水平或垂直分割线。

```tsx
import { Divider } from 'keyerext'

// 水平分割线
<Divider />

// 垂直分割线（配合 HStack 使用）
<HStack>
  <Text>左侧</Text>
  <Divider vertical />
  <Text>右侧</Text>
</HStack>
```

## 主题支持

组件支持日夜间主题切换，通过在根元素添加 `data-theme` 属性控制：

```tsx
// 日间模式（默认）
<div data-theme="light">
  <App />
</div>

// 夜间模式
<div data-theme="dark">
  <App />
</div>
```

## 完整示例

```tsx
import {
  Text,
  List,
  VStack,
  HStack,
  Input,
  Divider
} from 'keyerext'
import { useState } from 'react'

export default function ExamplePage() {
  const [searchText, setSearchText] = useState('')
  const [selectedId, setSelectedId] = useState('1')

  const groups = [
    {
      title: "工作项目",
      items: [
        { id: "1", content: <Text>项目 A</Text> },
        { id: "2", content: <Text>项目 B</Text> }
      ]
    },
    {
      title: "个人项目",
      items: [
        { id: "3", content: <Text>项目 C</Text> }
      ]
    }
  ]

  return (
    <VStack spacing={16} style={{ padding: '20px', alignItems: 'stretch' }}>
      <Text color="title" size="large">示例页面</Text>

      <Divider />

      <Input
        value={searchText}
        placeholder="搜索项目..."
        onChange={setSearchText}
        autoFocus
      />

      <List
        groups={groups}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onDoubleClick={(id) => alert(`打开项目: ${id}`)}
      />

      <Divider />

      <HStack spacing={8}>
        <Text color="subtitle" size="small">已选择:</Text>
        <Text color="title" size="small">{selectedId}</Text>
      </HStack>
    </VStack>
  )
}
```

## 样式定制

所有样式都在 `src/app/styles/components.css` 中定义，你可以通过修改 CSS 变量来自定义主题：

```css
:root {
  --color-title: #1a1a1a;
  --color-subtitle: #666666;
  --color-border: #e0e0e0;
  --color-hover: #f5f5f5;
  --color-selected: #e3f2fd;
  --color-bg: #ffffff;
  --color-input-bg: #ffffff;
  --color-divider: #e0e0e0;
}
```
