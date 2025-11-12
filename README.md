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
