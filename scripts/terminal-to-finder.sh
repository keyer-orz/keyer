#!/bin/bash

# @keyer.id com.keyer.terminal-to-finder
# @keyer.name 终端到Finder
# @keyer.desc 在Finder中打开当前终端所在目录

# 获取当前终端窗口的工作目录
terminalPath=$(osascript -e 'tell application "Terminal" to get the custom title of the front window' 2>/dev/null)

# 如果无法获取自定义标题，尝试获取当前进程的工作目录
if [ -z "$terminalPath" ]; then
    # 尝试从环境变量获取
    if [ -n "$PWD" ]; then
        terminalPath="$PWD"
    else
        terminalPath="$HOME"
    fi
fi

# 在 Finder 中打开该路径
open "$terminalPath"

echo "已在 Finder 中打开: $terminalPath"
