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