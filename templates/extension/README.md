# Clipboard History Extension

剪贴板历史记录扩展，自动跟踪和管理剪贴板内容。

## 功能特性

- 📋 **自动监听剪贴板**：每秒检查一次剪贴板变化，自动保存新内容
- 💾 **持久化存储**：使用 Store API 持久化保存历史记录，重启后不丢失
- 🔍 **快速搜索**：在 Keyer 主界面搜索历史记录
- 🎨 **二级面板**：打开专用面板浏览和过滤历史记录
- ⏱️ **时间标记**：显示每条记录的时间（刚刚、几分钟前、几小时前、几天前）
- 🔄 **去重处理**：自动去除重复内容，最新的内容排在最前面
- 📊 **限制数量**：最多保存 100 条历史记录

## 使用方法

### 方式一：直接搜索

1. **自动记录**：只要复制任何文本，就会自动保存到历史记录
2. **搜索历史**：在 Keyer 主界面输入搜索，会显示匹配的剪贴板历史
3. **复制历史**：选择任意历史记录，按 Enter 即可复制到剪贴板

### 方式二：使用面板（推荐）

1. **打开面板**：在 Keyer 中搜索 "Clipboard History Panel" 并选择
2. **过滤记录**：在面板顶部输入框输入关键词进行过滤
3. **选择记录**：
   - 使用 ↑↓ 键上下移动选择
   - 使用鼠标点击选择
4. **复制到剪贴板**：按 Enter 或点击项目
5. **关闭面板**：按 Esc 键

## 面板功能详解

### 搜索过滤
- 实时过滤：输入关键词即时显示匹配结果
- 大小写不敏感
- 支持模糊匹配

### 键盘导航
- `↑` / `↓` : 上下选择
- `Enter` : 复制选中项到剪贴板并关闭面板
- `Esc` : 关闭面板

### 显示效果
```
┌─────────────────────────────────────┐
│ Filter clipboard history...         │
├─────────────────────────────────────┤
│ Hello World                         │
│ Just now                           │
├─────────────────────────────────────┤
│ https://example.com                 │
│ 2m ago                             │
├─────────────────────────────────────┤
│ const x = 42;                       │
│ 5m ago                             │
└─────────────────────────────────────┘
  ↑↓ Navigate • Enter Copy • Esc Close
```

## 技术实现

- **监听方式**：使用定时器每秒检查 `electron.clipboard` 的内容
- **存储格式**：每条记录包含 `content`（内容）和 `timestamp`（时间戳）
- **UI 框架**：React
- **显示格式**：主列表显示 60 字符，面板显示 100 字符

## 配置参数

可以在代码中修改以下参数：

```typescript
MAX_HISTORY = 100           // 最大历史记录数量
CHECK_INTERVAL_MS = 1000    // 剪贴板检查间隔（毫秒）
```

## Command 和 Action Key 格式

### Command
- Key: `show-panel`
- 用途：打开剪贴板历史面板

### Action Keys
每条剪贴板历史的 key 格式为：`clipboard.{index}`

例如：
- `clipboard.0` - 最新的剪贴板记录
- `clipboard.1` - 第二新的记录
- ...

## 示例

### 直接搜索
假设你依次复制了以下内容：
1. "Hello World"
2. "https://example.com"
3. "const x = 42;"

在 Keyer 中输入 "hello" 会显示：
```
Hello World
Just now - Click to copy
```

### 使用面板
1. 搜索 "Clipboard History Panel" 并按 Enter
2. 在面板中输入 "https" 过滤
3. 使用 ↓ 键选择想要的链接
4. 按 Enter 复制到剪贴板

## 文件结构

```
clipboard-history/
├── index.ts              # 主扩展逻辑（剪贴板监听、存储）
├── ui.tsx                # 面板 UI 组件
├── package.json          # 配置文件（包含 command 定义）
├── tsconfig.json         # TypeScript 配置
├── tsconfig.ui.json      # UI TypeScript 配置
└── dist/
    ├── index.js          # 编译后的主逻辑
    └── ui.js             # 编译后的 UI 组件
```
