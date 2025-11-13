#!/bin/bash
# @keyer.icon 🖥️
# @keyer.name open-finder-in-terminal
# @keyer.title Finder->Terminal
# @keyer.desc 在终端中打开当前Finder所在目录
# @keyer.type Script

# 获取当前 Finder 窗口路径
finderPath=$(osascript -e 'tell application "Finder" to if (count of Finder windows) > 0 then get POSIX path of (target of front Finder window as text)')

if [ -z "$finderPath" ]; then
    echo "No Finder window is open"
    exit 1
fi

# 在终端中打开该路径
osascript -e "tell application \"Terminal\" to do script \"cd '$finderPath'\""
osascript -e "tell application \"Terminal\" to activate"
