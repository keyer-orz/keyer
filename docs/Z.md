把 electeon 移到 src/main 内，并修正编译的问题

---

把 Setting.css 内容移动到 App.css 内  
治理一下 color, 尽量使用 .app.theme, 不够的可以增加

---

src/renderer/settings/ExtensionsTab.tsx 去掉那些 icon
src/renderer/components/Settings.tsx 左列选项使用 List 组件

---

src/renderer/utils/SystemCommands.tsx 重构下
@system#xxxx: 表示 app 内置命令, 直接绑定组件，不要 navigateTo

---

ConfigManager 在主线程只有注册 hotkey 的功能
优化一下：
1. 使用单例
2. hotkey 的注册进行优化

---

src/renderer/contexts/NavigationContext.tsx  
src/renderer/components/ShortcutRecorder.tsx 
src/renderer/storage/ExtensionStorage.ts
src/renderer/utils

---

在 packages/keyerext 增加 Keyer 类
该类功能是桥接 插件 -> App 功能的调用

例如：hide-window， simulate-paste 等功能

---

src/main/main.ts 按业务拆分

---

Keyer 增加 Feature
1. showError
2. showToast