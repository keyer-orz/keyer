## Keyer
快捷键呼出命令面板，快捷执行命令

技术：Electron + React + Typescript 实现

ICommand
* id: 字符串, 类似于 com.xxx.xx
* name: 搜索关键字
* desc: 描述

扩展分为两类
1. script
通过注释的方式提供 command
```
# @keyer.name xx
# @keyer.desc xx
# @keyer.id xxx
```
2. extension
使用 TS 实现
通过 packages.json 提供 command
```
{
    ...
    commnads: [
        {
            id: "xx",
            name: "xx",
            desc: ""
        }
    ]
}
```
通过 IExtension 实现扩展逻辑
```
func onPrepare() // 准备阶段
func onSearch(input: String) -> IAction[] // 根据关键字返回结果
func doAction(action: IAction) // 执行命令
```

IAction extend ICommand
* id: command id
* name
* desc
* ext: any 扩展字段 由 onSearch 返回，并传递给 doAction

程序启动后
1. 扫描所有 script 注册 command
2. 扫描所有 extension 注册 command
3. 展示一个输入框
    1. 输入关键字，匹配 command + extension 的onSearch 的结果 列表展示
    2. 方向键上下选择，会车，执行 command / extension 的 doAction 

实现(仅实现这三个即可)
1. App打开(extension)
    * 包含“实用工具”目录
    * 包含中英文检索
2. 设置项打开(extension)
    * 包含“网络”和“Wifi”
3. Finder<->Terminal (sript实现)
    * 打开当前Finder所在目录到终端
    * 打开当前终端到Finder


App全局快捷键模块
按下 上/下时，如果当前界面有List组件，焦点切换到List组件，并支持List组件上下切换选项
按下 Esc 时，如果当前界面有 Input 组件
    焦点不在 Input, Input 获取焦点
    焦点在 Input, Input 清空
    Input是空的，返回主界面


重构下 Store

主进程增加 Store.ts 支持通过 extension_id/key/value 进度读写 扩展的 store.json
通过 IPC 暴露给 render 进程
src/shared/ExtensionStore.ts 只通过 ipc 进行数据的读写

---

1. src/renderer/components/MainView.tsx 使用 Panel 作为根容器
2. src/renderer/components/Settings.tsx 使用 Panel 作为根容器
3. List 的滚动条样式统一，支持 light / dark

去除 <div className="search-container"> 和 <div className="results-container"> 精简布局

---

1. 键盘选中为 select, 鼠标选中为 hover
2. 两者互不影响

--

列表的 item 有三个样式
1. 键盘上下选择，切换为选中样式
2. 鼠标悬浮 item 时，使用 hover样式，如果此时 item 已被选中，则使用 选中样式

--

src/renderer/App.tsx 中有 ArrowUp / ArrowDown ，这个去除即可
当前界面的 Input 组件默认获取焦点，键盘的 ArrowUp / ArrowDown 不会影响 Input 的焦点

--

首页：上下选择，回车 -> 根据回调判断是否隐藏 / 打开二级面板
二级页面：回车 -> 默认隐藏 App 后回首页

--

重构：IExtension 的 doAction 函数
返回 null | React.ComponentType<any>
若返回 null, doAction 后，关闭主面板
若返回 React.ComponentType<any>，则切换至插件的二级面板

注意：
keepOpen 不需要了
props 也没有了
剪切板的二级面板需要在组件内获取数据

-- 

extensions/clipboard-history 重构下
1. 将 UI 拆到独立的文件里
2. UI 分为左右布局，左侧为列表，右侧为预览
3. 剪切板支持图片和文本类型，列表内展示类型信息（你需要把老的持久化数据删了）, 文本展示文本自适应单元格宽度，图片展示 Image($width x $height)

--

取消剪切版插件的 footer
右侧预览和左侧列表中间放条线就行
预览背景和边框也去除

--

IExtension 重构
增加 onPreview 函数,参数为 Input 和 enabledPreview(默认为 false)
onPreview 返回 同 doAction

增加一个计算器插件
开启 enabledPreview
input输入类似"1+1="

App执行开启了 enabledPreview 的插件，调用其 onPreview
将返回的结果追加到 主面板列表的 顶部

--

重构 List 组件数据源支持 Section[] 和 Item[]
Section 结构为
{
    header: "xxx",
    items: Item[]
}
键盘仅支持 选中 Item
重构剪切板和 MainView

---

新增一个 samples 文件夹, 里面创建一个空白的插件

---

重构:
src/shared/CommandManager.ts -> src/shared/Commands.ts
src/shared/ExtensionManager.ts -> src/shared/Extensions.ts
src/shared/ScriptManager.ts -> src/shared/Scripts.ts
src/shared/ExtensionStore.ts -> src/shared/Store.ts
src/main/ConfigManager.ts -> src/main/Config.ts

---

重构:
App目录: /Users/milker/Library/Application Support/keyer
extensions: 更改为手动安装的插件
以插件的 package.json 中 name 作为文件夹的名字，例如：calculator
calculator 文件内 使用 store.json 作为插件的持久化存储文件

新增
src/main/ExtensionManager.ts 用于插件的安装，支持安装本地 zip 包
Settings-Extensions 增加安装入口 "本地安装"，点击后选择本地文件（注意校验）

src/shared/Extensions.ts 支持 载入本地安装的插件

---

设置面板，一个列表，可以展开
一级展示 组件的 title
二级列出组件 command
搜索以 command 过滤

---

把 Install from zip 暂时先删了。
每个 command 支持定义快捷键，直接执行，快捷键要持久化 

---

如果是设置界面，窗口变大。

---

ExtesnsionTab 去除二级 tab, 去除 alias

---

App.tsx 重构下
MainView和 SettingView 都采用内部消化掉逻辑
ViewType 和 面板组件建立映射