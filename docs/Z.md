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

---

使用 extension模式 改造 mainview（代码都放到main里面）
直接硬编码注册和配置
keyer/src/renderer/App.tsx 负责页面切换
main/setting/store

---

keyer/src/main/MainPanel.tsx 治理
handleExecute 直接调用全局的命令执行即可
handleExecuteCommandFromShortcut 应该不用了

---

1. IExtension 增加 doBack(): boolean, 可选择实现，不实现等同于返回 true
2. App.tsx Esc按键监听 中去除 [data-keyer-input="true"] 的逻辑，转成插件的 doBack(), 返回 true 则返回上一个界面
3. App.tsx 页面切换重做下，使用栈存储 commandId, Esc按键出栈，栈空则隐藏 App
4. Input组件要 移除 data-keyer-input
5. 具有二级 UI的 插件都要更新下

---

ICommand 增加 windowSize
SYSTEM_COMMANDS 去除，移到对应插件的 onPrepare 
增加系统插件的注册(和安装的插件要分离开)
NavigationContext.tsx 再简化下
现在已经全部是Extension机制了

---

keyer/packages/keyerext/src/Keyer.ts 增加剪切板的 API
完善下剪切板插件