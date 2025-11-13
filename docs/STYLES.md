# Keyer 样式系统文档

## 概述

Keyer 使用**全局样式 + CSS 变量**的方式管理样式，所有样式集中在 `src/renderer/App.css` 中定义，供 App、插件和 keyerext 组件共同使用。

## 架构设计

### 方案选择：全局样式 + CSS 变量

```
src/renderer/App.css
  ├── CSS 变量定义（主题支持）
  ├── App 基础样式
  ├── App 组件样式
  └── Keyerext 组件样式（供插件使用）
```

**优点**：
- ✅ 样式集中管理，易于维护
- ✅ 自动主题支持（通过 CSS 变量）
- ✅ 插件无需导入任何 CSS
- ✅ 无需额外构建步骤
- ✅ 样式自动加载，零配置

## CSS 变量系统

### Dark Theme（默认）
```css
.app.theme-dark {
  --bg-primary: #1a1a1a;
  --bg-secondary: #252525;
  --bg-tertiary: #2a2a2a;
  --bg-highlight: #3a3a3a;
  --text-primary: #fff;
  --text-secondary: #999;
  --text-tertiary: #666;
  --text-placeholder: #666;
  --border-color: rgba(255, 255, 255, 0.1);
  --border-subtle: rgba(255, 255, 255, 0.05);
}
```

### Light Theme
```css
.app.theme-light {
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f5;
  --bg-tertiary: #e5e5e5;
  --bg-highlight: #d5d5d5;
  --text-primary: #000;
  --text-secondary: #666;
  --text-tertiary: #999;
  --text-placeholder: #999;
  --border-color: rgba(0, 0, 0, 0.1);
  --border-subtle: rgba(0, 0, 0, 0.05);
}
```

## Keyerext 组件样式

### 可用组件
1. **List** - 可键盘导航的列表组件
2. **Item** - 标准列表项组件

### 样式类名

| 类名 | 用途 |
|------|------|
| `.keyer-list` | List 容器 |
| `.keyer-list-item` | List 项容器 |
| `.keyer-list-item.selected` | 选中状态 |
| `.keyer-list.mouse-active` | 鼠标激活模式 |
| `.keyer-item` | Item 布局容器 |
| `.keyer-item-icon` | Item 图标 |
| `.keyer-item-content` | Item 内容区 |
| `.keyer-item-header` | Item 头部 |
| `.keyer-item-title` | Item 标题 |
| `.keyer-item-description` | Item 描述 |
| `.keyer-item-badge` | Item 徽章 |

## 插件使用指南

### 使用 keyerext 组件

插件可以直接使用 keyerext 组件，**无需导入任何 CSS**：

```tsx
import { List, Item } from 'keyerext'

function MyExtensionPanel() {
  const items = [
    { id: 1, data: { name: 'Item 1' } },
    { id: 2, data: { name: 'Item 2' } },
  ]

  return (
    <List
      items={items}
      onEnter={(item) => console.log(item)}
      renderItem={(item) => (
        <Item
          icon="📋"
          title={item.data.name}
          description="Description"
        />
      )}
    />
  )
}
```

### 使用 CSS 变量

插件可以直接使用 App 的 CSS 变量：

```tsx
<div style={{
  backgroundColor: 'var(--bg-primary)',
  color: 'var(--text-primary)',
  borderColor: 'var(--border-color)'
}}>
  Content
</div>
```

## 构建流程

### App 构建
```bash
npm run build
# Vite 会将 App.css 打包到 dist/assets/index-*.css
```

### Keyerext 构建
```bash
cd packages/keyerext
npm run build
# 只编译 TypeScript，不包含任何 CSS
```

### 插件构建
```bash
cd extensions/your-extension
npm run build
# 只编译 TypeScript，不需要处理 CSS
```

## 样式加载流程

```
1. App 启动
   ↓
2. 加载 index.html
   ↓
3. 导入 App.tsx
   ↓
4. 导入 App.css（包含所有样式）
   ↓
5. 渲染 App + 插件
   ↓
6. 所有组件自动使用 App.css 中的样式
```

## 目录结构

```
keyer/
├── src/renderer/
│   ├── App.css                # 🎨 所有样式的中心
│   └── App.tsx
├── packages/keyerext/
│   ├── src/
│   │   ├── components/
│   │   │   └── List.tsx       # 组件（无 CSS）
│   │   └── index.ts
│   └── dist/                  # 编译后无 CSS 文件
└── extensions/
    └── clipboard-history/
        └── index.tsx          # 插件（无需导入 CSS）
```

## 迁移记录

### 改造前
- ❌ keyerext 包含 List.css
- ❌ 插件需要手动注入样式
- ❌ 样式分散在多个位置
- ❌ 构建需要处理 CSS 文件

### 改造后
- ✅ 所有样式集中在 App.css
- ✅ 插件零配置使用
- ✅ 样式统一管理
- ✅ 构建流程简化

## 最佳实践

### 1. 使用 CSS 变量
```tsx
// ✅ 好
<div style={{ color: 'var(--text-primary)' }}>Text</div>

// ❌ 差
<div style={{ color: '#fff' }}>Text</div>
```

### 2. 使用 keyerext 组件
```tsx
// ✅ 好
import { List, Item } from 'keyerext'
<List items={items} renderItem={(item) => <Item {...item} />} />

// ❌ 差 - 自己实现列表
<div className="my-custom-list">...</div>
```

### 3. 避免内联样式
```tsx
// ✅ 好 - 使用 keyerext 组件
<Item icon="📋" title="Title" />

// ⚠️ 可以 - 简单布局用内联样式
<div style={{ padding: '16px' }}>Content</div>

// ❌ 差 - 复杂样式用内联
<div style={{ /* 50 行样式 */ }}>Content</div>
```

## 添加新组件样式

如果需要在 keyerext 中添加新组件：

1. 在 `packages/keyerext/src/components/` 创建组件（不要创建 CSS 文件）
2. 在 `src/renderer/App.css` 的 "Keyerext 组件样式" 区域添加样式
3. 使用 CSS 变量确保主题支持
4. 重新构建 App

示例：
```css
/* App.css */

/* ========================================
   Keyerext 组件样式
   ======================================== */

/* 新组件样式 */
.keyer-new-component {
  background-color: var(--bg-primary);
  color: var(--text-primary);
}
```

## 常见问题

### Q: 插件如何自定义样式？
A: 使用内联样式 + CSS 变量，或在插件内定义临时样式。

### Q: 如何调试样式？
A: 在浏览器开发者工具中检查 `.app` 元素的 CSS 变量值。

### Q: 如何切换主题？
A: App 会自动切换 `.app` 的 class（`theme-dark` / `theme-light`），CSS 变量会自动更新。

### Q: keyerext 组件为什么没有样式？
A: 确保 App.css 已正确导入，检查 dist/assets/*.css 是否包含 keyerext 样式。

## 总结

Keyer 的样式系统通过**全局样式 + CSS 变量**实现了：
- 🎨 统一的视觉体验
- 🌓 自动主题切换
- 📦 零配置插件开发
- 🚀 简化的构建流程

所有样式都在 `src/renderer/App.css` 中管理，插件和 keyerext 组件直接使用，无需任何 CSS 导入或构建配置。
