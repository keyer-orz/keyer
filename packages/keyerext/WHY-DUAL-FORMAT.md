# 为什么 keyerext 需要同时支持 ESM 和 CJS？

## TL;DR

**必须同时支持两种格式**，因为：
- 扩展使用 CommonJS (`require`)
- App 渲染进程使用 ESM (`import`)

## 使用场景分析

### 场景 1：扩展动态加载（需要 CJS）

**位置**：`src/shared/ExtensionManager.ts:85`

```typescript
const extensionModule = require(mainPath)  // 动态加载扩展
```

**扩展代码**：`extensions/clipboard-history/index.tsx`

```typescript
import { IExtension, List, Item } from 'keyerext'
```

**编译后**：`extensions/clipboard-history/dist/index.js`

```javascript
const keyerext_1 = require("keyerext");  // ← 需要 CJS
```

**为什么必须用 CJS？**
1. 扩展在**运行时动态加载**（不在构建时）
2. 使用 Node.js 的 `require()` 系统加载
3. Electron 主进程环境，不支持动态 `import()`

### 场景 2：App 渲染进程（需要 ESM）

**位置**：`src/renderer/App.tsx:6`

```typescript
import { IExtensionResult } from 'keyerext'
```

**构建工具**：Vite

**为什么必须用 ESM？**
1. Vite 使用 ESM 作为模块系统
2. 构建时静态分析和 tree-shaking
3. 现代浏览器环境，原生支持 ESM

## 能否只用一种格式？

### ❌ 方案 A：只用 CJS

```json
// keyerext/package.json
{
  "main": "dist/index.cjs"
}
```

**问题**：
- ✅ 扩展可以正常加载（`require('keyerext')`）
- ❌ Vite 无法优化 CJS 模块
- ❌ 失去 tree-shaking 能力
- ❌ 构建包体积增大

### ❌ 方案 B：只用 ESM

```json
// keyerext/package.json
{
  "module": "dist/index.js"
}
```

**问题**：
- ✅ Vite 可以优化
- ❌ 扩展无法加载：`require('keyerext')` 会报错
- ❌ Node.js 的 `require()` 不支持 ESM（除非使用 `.mjs` 和动态 import）

### ❌ 方案 C：扩展也用 ESM

**需要改动**：
1. 所有扩展 tsconfig.json 改为 `"module": "esnext"`
2. ExtensionManager 改用动态 `import()`
3. package.json 添加 `"type": "module"`

**问题**：
- 需要重构整个扩展加载系统
- 动态 `import()` 是异步的，增加复杂度
- Electron 主进程对 ESM 支持不完善

## ✅ 最佳方案：双格式支持

```json
// keyerext/package.json
{
  "main": "dist/index.cjs",      // CJS 入口（扩展用）
  "module": "dist/index.js",     // ESM 入口（Vite 用）
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",   // ESM
      "require": "./dist/index.cjs",  // CJS
      "types": "./dist/index.d.ts"
    }
  }
}
```

**优点**：
- ✅ 扩展正常加载（CJS）
- ✅ Vite 优化和 tree-shaking（ESM）
- ✅ 类型定义共享
- ✅ 符合现代包的最佳实践

## 构建流程

```bash
# 1. 构建 ESM（供 Vite 使用）
tsc                                  → dist/*.js

# 2. 构建 CJS（供扩展使用）
tsc --module commonjs --outDir dist-cjs  → dist-cjs/*.js

# 3. 修复 CJS 导入路径
fix-cjs-imports.js                   → dist/*.cjs

# 4. 清理临时文件
rm -rf dist-cjs
```

## 实际加载路径

### Vite 构建 App 时

```
import { IExtensionResult } from 'keyerext'
         ↓
查找 package.json "exports"."import"
         ↓
加载 dist/index.js (ESM)
```

### 扩展运行时加载

```
require('keyerext')
         ↓
查找 package.json "main"
         ↓
加载 dist/index.cjs (CJS)
```

## 总结

**必须使用双格式**，因为：

1. **技术约束**
   - 扩展动态加载需要 `require()`（CJS）
   - Vite 构建需要静态 `import`（ESM）

2. **无法统一**
   - 改为全 ESM：需要重构扩展加载系统
   - 改为全 CJS：失去 Vite 优化能力

3. **最佳实践**
   - 现代 npm 包标准就是提供双格式
   - 让工具自动选择合适的格式

**fix-cjs-imports.js 的作用**：
- 确保 CJS 文件在 dist/ 目录下正确引用其他 CJS 文件
- 避免 `require('./hooks')` 错误加载 ESM 文件

这就是为什么我们需要同时维护 ESM 和 CJS 两种格式！
