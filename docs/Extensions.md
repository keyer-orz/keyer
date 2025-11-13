
# 定义
## extension
packages.json
* icon: 展示图标
* name: 存储名称, 建议 xxx-xxx-xx 即可
* title: 展示名称
* desc: 展示描述
* commands: Command

安装方式 // 现在不要实现
* ZIP安装(沙盒) 
* 路径安装(路径)

Command
* icon: 展示图标 >> ext 图标 >> 默认图标，
* name: 存储名称
* title: 展示名称
* desc: 展示描述
* type: 默认为 Command

## Script
一般为 shell 脚本
```
# 以注释的方式提供基本信息
# @keyer.icon ☀️
# @keyer.name com.xxx.xxx.xx
# @keyer.title Finder->Shell
# @keyer.desc 在终端中打开当前Finder所在目录
# @keyer.type 默认为 Script

echo "hello"
```

安装方式 // 现在不要实现
* ZIP安装(沙盒)
* 文件夹批量安装(路径)
* 文件安装(路径)


## 唯一标记(ucid): unique command id
* extension-command: `$ext.name#$cmd.name`
* script: `@script#script.name` _script_ 为固定值

## app配置文件
config.json
```
{
    "theme": "", // 主题
    "hotkey": "",
    "scripts": [
        "/xxx/xxx/xxx.sh" // 脚本路径
        "/xxx/xxx/xxxxx"  // 脚本文件夹
    ],
    "extensions": [
        "/xxx/xxx/xx" // extensions 路径
    ],
    "disabled": [
        "$ext.name#", // 禁用整个 ext
        "$ext.name#$cmd.name",  // 禁用 ext 命令
        "@script#script.name", // 禁用 脚本
    ],
    "hotkeys": {
        "$uid" : "HotKey"
    }
}
```

## app沙盒
根目录(app-root):~/Library/Application Support/keyer
```
$app-root/extensions: 沙箱内插件, zip解压后按照package.json 中 name 命名子文件夹
$app-root/scripts: 沙箱内脚本, zip解压后按照注释中的 @keyer.name 命名子文件文件夹
```

## 开发环境
项目根目录(project-root)
* extensions: 正在开发的插件
* scripts: 正在开发的脚本

## App启动
* 检索沙箱: $app-root/extensions $app-root/scripts
* 检索本地: config.json 中的 scripts extensions 对应的目录
* 检索开发环境 scripts extensions

如果有冲突，用该顺序: 开发环境 > 磁盘路径 > 沙箱

生成 extensions hash-map
生成 extension-commands hash-map
生成 script-commands hash-map
过滤掉禁用
* extensions(所有 commands)
* extension-commands
* script-commands

hotkeys注册

所有的 extension/command 和 script 都要有tip
* sandbox: 沙箱
* mine: 本地路径
* dev: 仅开发环境展示