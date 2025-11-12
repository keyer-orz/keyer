# Keyerext

Keyer 扩展开发 SDK - 提供类型定义和 React 组件，帮助开发者快速构建 Keyer 扩展。

## 功能特性

- 🎯 **TypeScript 支持** - 完整的类型定义
- ⚛️ **React 组件** - 开箱即用的 UI 组件（List, Item）
- 📦 **双模块格式** - 同时支持 ESM 和 CommonJS
- 🎨 **零样式配置** - 样式由 App 全局提供
- 🔌 **扩展 API** - 简单易用的扩展开发接口

## 构建流程

### 脚本说明

```json
{
  "scripts": {
    "clean": "rm -rf dist dist-cjs",
    "build": "npm run clean && npm run build:esm && npm run build:cjs",
    "build:esm": "tsc",
    "build:cjs": "tsc --module commonjs --outDir dist-cjs && node scripts/fix-cjs-imports.js && rm -rf dist-cjs",
    "watch": "tsc --watch",
    "prepublishOnly": "npm run build"
  }
}
```

### 构建步骤

1. **clean** - 清理旧的构建输出（dist/ 和 dist-cjs/）
2. **build:esm** - 编译为 ESM 格式
   - 使用 TypeScript 编译器（tsc）
   - 输出到 `dist/*.js`
3. **build:cjs** - 编译为 CJS 格式
   - 编译到临时目录 `dist-cjs/`
   - 运行 `fix-cjs-imports.js` 修复导入路径和扩展名
   - 将处理后的 `.cjs` 文件复制到 `dist/`
   - 删除临时目录

### 输出结构

```
dist/
├── components/
│   ├── List.js          # ESM 格式
│   ├── List.cjs         # CJS 格式
│   ├── List.d.ts        # 类型定义
├── hooks.js
├── hooks.cjs
├── hooks.d.ts
├── index.js
├── index.cjs
└── index.d.ts
```

### 为什么需要两种格式？

- **ESM (`.js`)** - 用于 Vite 等现代构建工具和 React 组件
- **CJS (`.cjs`)** - 用于 Electron 主进程和扩展动态加载

### fix-cjs-imports.js 做了什么？

该脚本处理 CommonJS 模块的导入：

1. 将 `require('./xxx')` 改为 `require('./xxx.cjs')`
2. 将编译后的 `.js` 文件重命名为 `.cjs`
3. 保留已有扩展名的导入（.cjs, .js, .json）

这是必要的，因为：
- TypeScript 编译时不会添加文件扩展名
- Node.js 需要明确的扩展名来区分 ESM 和 CJS

## 样式系统

**重要**：keyerext 不包含任何 CSS 文件！

所有样式由 Keyer App 的 `src/renderer/App.css` 提供，扩展可以直接使用：

```tsx
// ✅ 直接使用组件，无需导入 CSS
import { List, Item } from 'keyerext'

<List items={items} renderItem={(item) => <Item {...item} />} />
```

### CSS 变量

App 提供的 CSS 变量（自动主题支持）：

```css
--bg-primary      /* 主背景色 */
--bg-secondary    /* 次背景色 */
--bg-highlight    /* 高亮背景色 */
--text-primary    /* 主文本色 */
--text-secondary  /* 次文本色 */
--border-color    /* 边框颜色 */
```

## 开发指南

### 目录结构

```
packages/keyerext/
├── src/
│   ├── components/
│   │   └── List.tsx       # React 组件（无 CSS）
│   ├── hooks.ts           # React Hooks
│   └── index.ts           # 主入口
├── scripts/
│   └── fix-cjs-imports.js # CJS 构建后处理脚本
├── dist/                  # 构建输出
├── tsconfig.json
├── package.json
└── README.md
```

### 添加新组件

1. 在 `src/components/` 创建组件（仅 `.tsx` 文件，不要创建 CSS）
2. 在 `../../src/renderer/App.css` 添加样式（使用 CSS 变量）
3. 从 `src/index.ts` 导出组件
4. 运行 `npm run build`

### 调试

```bash
# 监听模式（仅 ESM）
npm run watch

# 完整构建
npm run build

# 清理构建产物
npm run clean
```

## 注意事项

1. **不要创建 CSS 文件** - 所有样式应在 App.css 中定义
2. **使用 CSS 变量** - 确保主题兼容性
3. **React 作为 peerDependency** - 不打包 React
4. **类型安全** - 充分利用 TypeScript
5. **双格式支持** - 确保 ESM 和 CJS 都能正常工作

## License

MIT
